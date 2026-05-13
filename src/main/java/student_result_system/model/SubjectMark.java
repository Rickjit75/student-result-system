package student_result_system.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "subject_marks")
public class SubjectMark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subjectName;
    private int marks;

    @ManyToOne
    @JoinColumn(name = "student_id")
    @JsonIgnore
    private Student student;
}