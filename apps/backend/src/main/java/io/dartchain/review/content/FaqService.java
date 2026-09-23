package io.dartchain.review.content;

import io.dartchain.review.auth.UserEntity;
import io.dartchain.review.auth.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FaqService {

	private final FaqQuestionRepository questions;
	private final UserRepository users;

	public FaqService(FaqQuestionRepository questions, UserRepository users) {
		this.questions = questions;
		this.users = users;
	}

	@Transactional(readOnly = true)
	public List<FaqQuestionResponse> list() {
		return questions.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
	}

	@Transactional
	public FaqQuestionResponse submit(Long userId, SubmitFaqRequest request) {
		UserEntity author = users
				.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Compte introuvable"));
		FaqQuestionEntity entity = new FaqQuestionEntity();
		entity.setTitle(request.title().trim());
		entity.setBody(request.body().trim());
		entity.setAuthor(author);
		entity.setStatus("PENDING");
		questions.save(entity);
		return toResponse(entity);
	}

	private FaqQuestionResponse toResponse(FaqQuestionEntity entity) {
		return new FaqQuestionResponse(
				entity.getId(),
				entity.getTitle(),
				entity.getBody(),
				entity.getOfficialAnswer(),
				entity.getStatus(),
				entity.getAuthor().getDisplayName(),
				entity.getCreatedAt());
	}
}
