package io.r4v3chain.review.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		String email = request.email().trim().toLowerCase();
		if (users.existsByEmailIgnoreCase(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Un compte existe déjà avec cet e-mail");
		}
		UserEntity user = new UserEntity();
		user.setEmail(email);
		user.setDisplayName(request.displayName().trim());
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		users.save(user);
		return new AuthResponse(jwtService.issueToken(user), UserResponse.from(user));
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		UserEntity user = users
				.findByEmailIgnoreCase(request.email().trim().toLowerCase())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides"));
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants invalides");
		}
		return new AuthResponse(jwtService.issueToken(user), UserResponse.from(user));
	}

	@Transactional(readOnly = true)
	public UserResponse me(Long userId) {
		UserEntity user = users
				.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session invalide"));
		return UserResponse.from(user);
	}
}
