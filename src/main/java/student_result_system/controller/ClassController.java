package student_result_system.controller;

import student_result_system.model.Class;
import student_result_system.model.Section;
import student_result_system.service.ClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ClassController {

    @Autowired
    private ClassService classService;

    @GetMapping
    public List<Class> getAllClasses() {
        return classService.getAllClasses();
    }

    @PostMapping
    public ResponseEntity<?> addClass(@RequestBody Class c) {
        Map<String, Object> result = classService.addClass(c);
        if (!(Boolean) result.get("success")) {
            return ResponseEntity.status(409).body(result);
        }
        return ResponseEntity.ok(result.get("class"));
    }

    @DeleteMapping("/{id}")
    public String deleteClass(@PathVariable Long id) {
        classService.deleteClass(id);
        return "Class deleted";
    }

    @PostMapping("/{classId}/sections")
    public Section addSection(@PathVariable Long classId, @RequestBody Section section) {
        return classService.addSection(classId, section);
    }

    @DeleteMapping("/sections/{sectionId}")
    public String deleteSection(@PathVariable Long sectionId) {
        classService.deleteSection(sectionId);
        return "Section deleted";
    }

    @GetMapping("/{classId}/sections")
    public List<Section> getSections(@PathVariable Long classId) {
        return classService.getSectionsByClass(classId);
    }
}