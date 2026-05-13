package student_result_system.controller;

import student_result_system.model.Student;
import student_result_system.model.SubjectMark;
import student_result_system.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class StudentController {

    @Autowired
    private StudentService service;

    @PostMapping
    public Student addStudent(@RequestBody Student s) {
        return service.addStudent(s);
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
}