package io.r4v3chain.review.auth;

public record UserResponse(Long id, String email, String displayName) {
	public static UserResponse from(UserEntity user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName());
	}
}
