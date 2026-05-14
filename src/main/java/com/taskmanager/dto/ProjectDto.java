package com.taskmanager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProjectDto {
    @NotBlank(message = "Project name is required")
    private String name;
    private String description;
}
