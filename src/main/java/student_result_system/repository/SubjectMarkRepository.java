package student_result_system.repository;

import student_result_system.model.SubjectMark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectMarkRepository extends JpaRepository<SubjectMark, Long> {
}