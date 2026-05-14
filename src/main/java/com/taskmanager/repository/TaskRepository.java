package com.taskmanager.repository;

import com.taskmanager.entity.Project;
import com.taskmanager.entity.Task;
import com.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProject(Project project);

    List<Task> findByAssignee(User user);

    long countByAssigneeAndStatus(User user, Task.Status status);

    // Use enum parameter binding instead of inline enum reference
    @Query("SELECT t FROM Task t WHERE t.assignee = :user AND t.dueDate < :today AND t.status <> :done")
    List<Task> findOverdueTasks(@Param("user") User user, @Param("today") LocalDate today, @Param("done") Task.Status done);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
    long countByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") Task.Status status);

    long countByAssignee(User user);

    // Count tasks assigned to user that are overdue (not DONE)
    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee = :user AND t.dueDate < :today AND t.status <> :done")
    long countOverdueForUser(@Param("user") User user, @Param("today") LocalDate today, @Param("done") Task.Status done);
}
