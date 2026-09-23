package io.dartchain.review.health;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health probe scaffold — extend in Phase 1.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

	@GetMapping
	public Map<String, Object> health() {
		return Map.of(
				"status", "UP",
				"service", "dartchain-review-backend",
				"phase", "scaffold");
	}
}
