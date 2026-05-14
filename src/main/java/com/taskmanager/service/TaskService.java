package com.taskmanager.service;

import com.taskmanager.dto.TaskDto;
import com.taskmanager.entity.*;
import com.taskmanager.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TaskService {

    @Autowired private TaskRepository taskRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectMemberRepository projectMemberRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public Map<String, Object> createTask(Long projectId, TaskDto dto) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        assertAdmin(project, currentUser);

        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setPriority(dto.getPriority() != null ? dto.getPriority() : Task.Priority.MEDIUM);
        task.setStatus(Task.Status.TODO);
        task.setProject(project);
        task.setCreatedBy(currentUser);

        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            task.setAssignee(assignee);
        }

        task = taskRepository.save(task);
        return buildTaskMap(task);
    }

    public List<Map<String, Object>> getProjectTasks(Long projectId) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        assertMember(project, currentUser);

        List<Task> tasks = taskRepository.findByProject(project);
        Optional<ProjectMember> pm = projectMemberRepository.findByProjectAndUser(project, currentUser);
        boolean isAdmin = pm.isPresent() && pm.get().getRole() == ProjectMember.ProjectRole.ADMIN;

        if (!isAdmin) {
            tasks = tasks.stream()
                    .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(currentUser.getId()))
                    .collect(Collectors.toList());
        }

        return tasks.stream().map(this::buildTaskMap).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updateTask(Long taskId, TaskDto dto) {
        User currentUser = getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Optional<ProjectMember> pm = projectMemberRepository.findByProjectAndUser(task.getProject(), currentUser);
        boolean isAdmin = pm.isPresent() && pm.get().getRole() == ProjectMember.ProjectRole.ADMIN;
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssignee) throw new RuntimeException("Access denied");

        if (isAdmin) {
            task.setTitle(dto.getTitle() != null ? dto.getTitle() : task.getTitle());
            task.setDescription(dto.getDescription());
            task.setDueDate(dto.getDueDate());
            if (dto.getPriority() != null) task.setPriority(dto.getPriority());
            if (dto.getAssigneeId() != null) {
                User assignee = userRepository.findById(dto.getAssigneeId())
                        .orElseThrow(() -> new RuntimeException("Assignee not found"));
                task.setAssignee(assignee);
            }
        }

        if (dto.getStatus() != null) task.setStatus(dto.getStatus());
        task = taskRepository.save(task);
        return buildTaskMap(task);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        User currentUser = getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        assertAdmin(task.getProject(), currentUser);
        taskRepository.delete(task);
    }

    private void assertMember(Project project, User user) {
        boolean isMember = projectMemberRepository.existsByProjectAndUser(project, user);
        boolean isOwner = project.getOwner().getId().equals(user.getId());
        if (!isMember && !isOwner) throw new RuntimeException("Access denied");
    }

    private void assertAdmin(Project project, User user) {
        Optional<ProjectMember> pm = projectMemberRepository.findByProjectAndUser(project, user);
        if (pm.isEmpty() || pm.get().getRole() != ProjectMember.ProjectRole.ADMIN) {
            throw new RuntimeException("Admin access required");
        }
    }

    public Map<String, Object> buildTaskMap(Task t) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", t.getId());
        map.put("title", t.getTitle());
        map.put("description", t.getDescription());
        map.put("dueDate", t.getDueDate());
        map.put("priority", t.getPriority().name());
        map.put("status", t.getStatus().name());
        map.put("projectId", t.getProject().getId());
        map.put("createdAt", t.getCreatedAt());
        if (t.getAssignee() != null) {
            map.put("assigneeId", t.getAssignee().getId());
            map.put("assigneeName", t.getAssignee().getName());
        } else {
            map.put("assigneeId", null);
            map.put("assigneeName", null);
        }
        map.put("createdById", t.getCreatedBy().getId());
        map.put("createdByName", t.getCreatedBy().getName());
        return map;
    }
}
