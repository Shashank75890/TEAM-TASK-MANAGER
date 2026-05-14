package com.taskmanager.dto;

import lombok.Data;

@Data
public class MemberDto {
    private Long userId;
    private String role; // "ADMIN" or "MEMBER"
}
