package io.r4v3chain.review.content;

import java.time.Instant;

public record FaqQuestionResponse(
		Long id,
		String title,
		String body,
		String officialAnswer,
		String status,
		String authorDisplayName,
		Instant createdAt) {}
