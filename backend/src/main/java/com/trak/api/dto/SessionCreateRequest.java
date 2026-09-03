package com.trak.api.dto;

import jakarta.validation.constraints.NotBlank;

public record SessionCreateRequest(@NotBlank String title) {
}
