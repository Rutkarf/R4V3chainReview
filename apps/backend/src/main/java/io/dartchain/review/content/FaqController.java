package io.dartchain.review.content;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/faq")
public class FaqController {

	private final FaqService faqService;

	public FaqController(FaqService faqService) {
		this.faqService = faqService;
	}

	@GetMapping
	public List<FaqQuestionResponse> list() {
		return faqService.list();
	}

	@PostMapping
	public FaqQuestionResponse submit(Authentication authentication, @Valid @RequestBody SubmitFaqRequest request) {
		Long userId = Long.valueOf(authentication.getName());
		return faqService.submit(userId, request);
	}
}
