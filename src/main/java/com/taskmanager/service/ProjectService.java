package com.taskmanager.service;

import com.taskmanager.dto.MemberDto;
import com.taskmanager.dto.ProjectDto;
import com.taskmanager.entity.Project;
import com.taskmanager.entity.ProjectMember;
import com.taskmanager.entity.User;
import com.taskmanager.repository.ProjectMemberRepository;
import com.taskmanager.repository.ProjectRepository;
import com.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    @Autowired private ProjectRepository projectRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProjectMemberRepository projectMemberRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public Map<String, Object> createProject(ProjectDto dto) {
        User currentUser = getCurrentUser();
        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setOwner(currentUser);
        project = projectRepository.save(project);

        // Creator is project ADMIN
        ProjectMember member = new ProjectMember();
        member.setProject(project);
        member.setUser(currentUser);
        member.setRole(ProjectMember.ProjectRole.ADMIN);
        projectMemberRepository.save(member);

        return buildProjectMap(project, ProjectMember.ProjectRole.ADMIN);
    }

    public List<Map<String, Object>> getUserProjects() {
        User currentUser = getCurrentUser();
        List<Project> projects = projectRepository.findByMemberOrOwner(currentUser);
        List<Map<String, Object>> result = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (Project p : projects) {
            if (seen.contains(p.getId())) continue;
            seen.add(p.getId());
            Optional<ProjectMember> pm = projectMemberRepository.findByProjectAndUser(p, currentUser);
            ProjectMember.ProjectRole role = pm.map(ProjectMember::getRole).orElse(ProjectMember.ProjectRole.MEMBER);
            result.add(buildProjectMap(p, role));
        }
        return result;
    }

    public Map<String, Object> getProjectById(Long projectId) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        assertMember(project, currentUser);
        Optional<ProjectMember> pm = projectMemberRepository.findByProjectAndUser(project, currentUser);
        ProjectMember.ProjectRole role = pm.map(ProjectMember::getRole).orElse(ProjectMember.ProjectRole.MEMBER);
        Map<String, Object> map = buildProjectMap(project, role);

        // Add members list
        List<ProjectMember> members = projectMemberRepository.findByProject(project);
        List<Map<String, Object>> memberList = members.stream().map(m -> {
            Map<String, Object> mMap = new LinkedHashMap<>();
            mMap.put("userId", m.getUser().getId());
            mMap.put("name", m.getUser().getName());
            mMap.put("email", m.getUser().getEmail());
            mMap.put("role", m.getRole().name());
            return mMap;
        }).collect(Collectors.toList());
        map.put("members", memberList);
        return map;
    }

    @Transactional
    public Map<String, Object> addMember(Long projectId, MemberDto dto) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        assertAdmin(project, currentUser);

        User userToAdd = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (projectMemberRepository.existsByProjectAndUser(project, userToAdd)) {
            throw new RuntimeException("User is already a member");
        }

        ProjectMember.ProjectRole role = ProjectMember.ProjectRole.MEMBER;
        if ("ADMIN".equalsIgnoreCase(dto.getRole())) role = ProjectMember.ProjectRole.ADMIN;

        ProjectMember pm = new ProjectMember();
        pm.setProject(project);
        pm.setUser(userToAdd);
        pm.setRole(role);
        projectMemberRepository.save(pm);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("userId", userToAdd.getId());
        res.put("name", userToAdd.getName());
        res.put("email", userToAdd.getEmail());
        res.put("role", role.name());
        return res;
    }

    @Transactional
    public void removeMember(Long projectId, Long userId) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        assertAdmin(project, currentUser);
        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (userToRemove.getId().equals(project.getOwner().getId())) {
            throw new RuntimeException("Cannot remove project owner");
        }
        projectMemberRepository.deleteByProjectAndUser(project, userToRemove);
    }

    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            return m;
        }).collect(Collectors.toList());
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

    private Map<String, Object> buildProjectMap(Project p, ProjectMember.ProjectRole role) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("name", p.getName());
        map.put("description", p.getDescription());
        map.put("ownerId", p.getOwner().getId());
        map.put("ownerName", p.getOwner().getName());
        map.put("userRole", role.name());
        map.put("createdAt", p.getCreatedAt());
        return map;
    }
}
