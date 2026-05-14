package com.taskmanager.dto;

import com.taskmanager.entity.Task;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskDto {
    @NotBlank(message = "Task title is required")
    private String title;
    private String description;
    private LocalDate dueDate;
    private Task.Priority priority;
    private Task.Status status;
    private Long assigneeId;
}
