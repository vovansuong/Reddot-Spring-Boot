package com.reddot.app.dto.response;

import com.reddot.app.entity.Comment;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * This type represents a question on the site.
 * This type is heavily inspired by the question page itself, and can optionally return comments accordingly.
 * The upvoted, downvoted, and bookmarked fields can only be queried for with an access_token.
 */
@Data
public class QuestionDTO {
    // TODO: Design Improvements: Avoid Direct Entity Usage in DTOs (CommentDTO)
    private Integer questionId;
    private String title;
    private String body;
    private Set<TagDTO> tags;
    private ShallowUserDTO owner;
    private LocalDateTime creationDate;
    private LocalDateTime lastEditDate;
    private LocalDateTime closeDate;
    private Integer upvotes;
    private Boolean upvoted;
    private Integer downvotes;
    private Boolean downvoted;
    private Boolean bookmarked;
    private Integer commentCount;
    private List<Comment> commentList;
}