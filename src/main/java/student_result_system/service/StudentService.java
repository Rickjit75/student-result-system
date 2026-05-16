package student_result_system.service;

import student_result_system.model.Student;
import student_result_system.model.SubjectMark;
import student_result_system.repository.StudentRepository;
import student_result_system.repository.SubjectMarkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @Autowired
    private StudentRepository repo;

    @Autowired
    private SubjectMarkRepository subjectMarkRepo;

    public Student addStudent(Student s) {
        if (repo.existsByEmail(s.getEmail())) {
            throw new RuntimeException("DUPLICATE_EMAIL");
        }
        if (s.getExtraSubjects() != null) {
            for (SubjectMark sub : s.getExtraSubjects()) {
                sub.setStudent(s);
            }
        }
        return repo.save(s);
    }

    public List<Student> getAllStudents() {
        return repo.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return repo.findById(id);
    }

    public Student updateStudent(Long id, Student updated) {
        updated.setId(id);
        if (updated.getExtraSubjects() != null) {
            for (SubjectMark sub : updated.getExtraSubjects()) {
                sub.setStudent(updated);
            }
        }
        return repo.save(updated);
    }

    public void deleteStudent(Long id) {
        repo.deleteById(id);
    }

    public SubjectMark addExtraSubject(Long studentId, SubjectMark subject) {
        Student student = repo.findById(studentId).orElseThrow();
        subject.setStudent(student);
        return subjectMarkRepo.save(subject);
    }

    public void deleteExtraSubject(Long subjectId) {
        subjectMarkRepo.deleteById(subjectId);
    }

    public boolean emailExists(String email) {
        return repo.existsByEmail(email);
    }
}