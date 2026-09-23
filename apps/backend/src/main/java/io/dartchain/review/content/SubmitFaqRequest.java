package io.dartchain.review.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitFaqRequest(
		@NotBlank @Size(min = 8, max = 220) String title,
		@NotBlank @Size(min = 20, max = 4000) String body) {}
