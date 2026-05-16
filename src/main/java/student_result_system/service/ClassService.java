package student_result_system.service;

import student_result_system.model.Class;
import student_result_system.model.Section;
import student_result_system.repository.ClassRepository;
import student_result_system.repository.SectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ClassService {

    @Autowired
    private ClassRepository classRepo;

    @Autowired
    private SectionRepository sectionRepo;

    public List<Class> getAllClasses() {
        return classRepo.findAll();
    }

    public Map<String, Object> addClass(Class c) {
        Map<String, Object> response = new HashMap<>();
        if (classRepo.existsByName(c.getName())) {
            response.put("success", false);
            response.put("message", "Class already exists.");
            return response;
        }
        response.put("success", true);
        response.put("class", classRepo.save(c));
        return response;
    }

    public void deleteClass(Long id) {
        classRepo.deleteById(id);
    }

    public Section addSection(Long classId, Section section) {
        Class c = classRepo.findById(classId).orElseThrow();
        section.setClassEntity(c);
        return sectionRepo.save(section);
    }

    public void deleteSection(Long sectionId) {
        sectionRepo.deleteById(sectionId);
    }

    public List<Section> getSectionsByClass(Long classId) {
        return sectionRepo.findByClassEntityId(classId);
    }
}