package student_result_system.controller;

import student_result_system.model.Student;
import student_result_system.model.SubjectMark;
import student_result_system.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
                RequestMethod.DELETE, RequestMethod.OPTIONS})
public class StudentController {

    @Autowired
    private StudentService service;

    @PostMapping
    public ResponseEntity<?> addStudent(@RequestBody Student s) {
        try {
            return ResponseEntity.ok(service.addStudent(s));
        } catch (RuntimeException e) {
            if ("DUPLICATE_EMAIL".equals(e.getMessage())) {
                return ResponseEntity.status(409)
                        .body(Map.of("error", "A student with this email already exists."));
            }
            throw e;
        }
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return service.getAllStudents();
    }

    @GetMapping("/{id}")
    public Student getStudent(@PathVariable Long id) {
        return service.getStudentById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable Long id, @RequestBody Student s) {
        return service.updateStudent(id, s);
    }

    @DeleteMapping("/{id}")
    public String deleteStudent(@PathVariable Long id) {
        service.deleteStudent(id);
        return "Student deleted successfully";
    }

    @PostMapping("/{id}/subjects")
    public SubjectMark addExtraSubject(@PathVariable Long id, @RequestBody SubjectMark subject) {
        return service.addExtraSubject(id, subject);
    }

    @DeleteMapping("/subjects/{subjectId}")
    public String deleteExtraSubject(@PathVariable Long subjectId) {
        service.deleteExtraSubject(subjectId);
        return "Subject deleted";
    }

    @GetMapping("/check-email")
    public Map<String, Boolean> checkEmail(@RequestParam String email) {
        return Map.of("exists", service.emailExists(email));
    }
}