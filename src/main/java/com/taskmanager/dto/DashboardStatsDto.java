package com.taskmanager.dto;

import lombok.Data;
import java.util.List;

@Data
public class DashboardStatsDto {
    private long totalTasks;
    private long todoTasks;
    private long inProgressTasks;
    private long doneTasks;
    private long overdueTasks;
    private List<ProjectStat> projectStats;

    @Data
    public static class ProjectStat {
        private Long projectId;
        private String projectName;
        private long totalTasks;
        private long doneTasks;
        private long inProgressTasks;
        private long todoTasks;
        private String userRole;
    }
}
