package com.taskmanager.service;

import com.taskmanager.dto.DashboardStatsDto;
import com.taskmanager.entity.*;
import com.taskmanager.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    @Autowired private UserRepository userRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private ProjectMemberRepository projectMemberRepository;
    @Autowired private TaskRepository taskRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public DashboardStatsDto getStats() {
        User currentUser = getCurrentUser();
        LocalDate today = LocalDate.now();

        DashboardStatsDto stats = new DashboardStatsDto();
        stats.setTotalTasks(taskRepository.countByAssignee(currentUser));
        stats.setTodoTasks(taskRepository.countByAssigneeAndStatus(currentUser, Task.Status.TODO));
        stats.setInProgressTasks(taskRepository.countByAssigneeAndStatus(currentUser, Task.Status.IN_PROGRESS));
        stats.setDoneTasks(taskRepository.countByAssigneeAndStatus(currentUser, Task.Status.DONE));
        stats.setOverdueTasks(taskRepository.countOverdueForUser(currentUser, today, Task.Status.DONE));

        List<Project> projects = projectRepository.findByMemberOrOwner(currentUser);
        Set<Long> seen = new HashSet<>();
        List<DashboardStatsDto.ProjectStat> projectStats = new ArrayList<>();

        for (Project p : projects) {
            if (seen.contains(p.getId())) continue;
            seen.add(p.getId());

            DashboardStatsDto.ProjectStat ps = new DashboardStatsDto.ProjectStat();
            ps.setProjectId(p.getId());
            ps.setProjectName(p.getName());
            ps.setTotalTasks(taskRepository.countByProjectIdAndStatus(p.getId(), Task.Status.TODO)
                    + taskRepository.countByProjectIdAndStatus(p.getId(), Task.Status.IN_PROGRESS)
                    + taskRepository.countByProjectIdAndStatus(p.getId(), Task.Status.DONE));
            ps.setTodoTasks(taskRepository.countByProjectIdAndStatus(p.getId(), Task.Status.TODO));
            ps.setInProgressTasks(taskRepository.countByProjectIdAndStatus(p.getId(), Task.Status.IN_PROGRESS));
            ps.setDoneTasks(taskRepository.countByProjectIdAndStatus(p.getId(), Task.Status.DONE));

            Optional<ProjectMember> pm = projectMemberRepository.findByProjectAndUser(p, currentUser);
            ps.setUserRole(pm.map(m -> m.getRole().name()).orElse("MEMBER"));
            projectStats.add(ps);
        }

        stats.setProjectStats(projectStats);
        return stats;
    }
}
