package io.dartchain.review.auth;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	private final byte[] secret;
	private final long ttlHours;

	public JwtService(
			@Value("${dartchain.review.jwt.secret}") String secret,
			@Value("${dartchain.review.jwt.ttl-hours:168}") long ttlHours) {
		byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
		if (bytes.length < 32) {
			throw new IllegalStateException("dartchain.review.jwt.secret must be at least 32 bytes");
		}
		this.secret = bytes;
		this.ttlHours = ttlHours;
	}

	public String issueToken(UserEntity user) {
		Instant now = Instant.now();
		JWTClaimsSet claims = new JWTClaimsSet.Builder()
				.subject(String.valueOf(user.getId()))
				.claim("email", user.getEmail())
				.claim("name", user.getDisplayName())
				.issueTime(Date.from(now))
				.expirationTime(Date.from(now.plusSeconds(ttlHours * 3600)))
				.build();
		SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
		try {
			jwt.sign(new MACSigner(secret));
			return jwt.serialize();
		} catch (JOSEException e) {
			throw new IllegalStateException("Unable to sign JWT", e);
		}
	}

	public JWTClaimsSet parse(String token) {
		try {
			SignedJWT jwt = SignedJWT.parse(token);
			if (!jwt.verify(new MACVerifier(secret))) {
				throw new IllegalArgumentException("Invalid JWT signature");
			}
			JWTClaimsSet claims = jwt.getJWTClaimsSet();
			Date exp = claims.getExpirationTime();
			if (exp != null && exp.toInstant().isBefore(Instant.now())) {
				throw new IllegalArgumentException("JWT expired");
			}
			return claims;
		} catch (ParseException | JOSEException e) {
			throw new IllegalArgumentException("Invalid JWT", e);
		}
	}
}
