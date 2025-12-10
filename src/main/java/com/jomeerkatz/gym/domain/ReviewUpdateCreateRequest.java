package com.jomeerkatz.gym.domain;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewUpdateCreateRequest {

    private String content;

    private Integer rating;

    private List<String> photoIds;
}
