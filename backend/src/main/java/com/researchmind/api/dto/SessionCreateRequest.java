package com.researchmind.api.dto;

import jakarta.validation.constraints.NotBlank;

public record SessionCreateRequest(@NotBlank String title) {
}
