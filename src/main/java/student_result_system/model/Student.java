package student_result_system.model;
import jakarta.persistence.FetchType;
import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;


@Entity
@Data
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private int mathMarks;
    private int scienceMarks;
    private int englishMarks;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<SubjectMark> extraSubjects = new ArrayList<>();
    public double getAverage() {
        int total = mathMarks + scienceMarks + englishMarks;
        int count = 3;
        for (SubjectMark s : extraSubjects) {
            total += s.getMarks();
            count++;
        }
        return total / (double) count;
    }

    public String getGrade() {
        double avg = getAverage();
        if (avg >= 90) return "A+";
        else if (avg >= 75) return "A";
        else if (avg >= 60) return "B";
        else if (avg >= 45) return "C";
        else return "F";
    }
}