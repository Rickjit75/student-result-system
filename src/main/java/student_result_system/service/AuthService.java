package student_result_system.service;

import student_result_system.model.Teacher;
import student_result_system.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private TeacherRepository teacherRepo;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public Map<String, Object> register(Teacher teacher) {
        Map<String, Object> response = new HashMap<>();
        if (teacherRepo.existsByEmail(teacher.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already registered. Please login.");
            return response;
        }
        teacher.setPassword(encoder.encode(teacher.getPassword()));
        Teacher saved = teacherRepo.save(teacher);
        saved.setPassword(null);
        response.put("success", true);
        response.put("teacher", saved);
        return response;
    }

    public Map<String, Object> login(String email, String password) {
        Map<String, Object> response = new HashMap<>();
        Teacher teacher = teacherRepo.findByEmail(email).orElse(null);
        if (teacher == null || !encoder.matches(password, teacher.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid email or password.");
            return response;
        }
        teacher.setPassword(null);
        response.put("success", true);
        response.put("teacher", teacher);
        return response;
    }
}