package com.crime.analytics.core.config;

import com.crime.analytics.ai.services.AiPipelineService;
import com.crime.analytics.models.entities.Case;
import com.crime.analytics.models.entities.User;
import com.crime.analytics.models.repositories.CaseRepository;
import com.crime.analytics.models.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CaseRepository caseRepository;
    private final AiPipelineService aiPipelineService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User admin = null;
        if (!userRepository.existsByEmail("admin@crimeanalytics.gov")) {
            admin = userRepository.save(User.builder()
                    .email("admin@crimeanalytics.gov")
                    .password(passwordEncoder.encode("Admin@123"))
                    .firstName("System")
                    .lastName("Administrator")
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build());
            log.info("Default Admin user created: admin@crimeanalytics.gov");
        } else {
            admin = userRepository.findByEmail("admin@crimeanalytics.gov").orElse(null);
        }

        User investigator = null;
        if (!userRepository.existsByEmail("investigator@crimeanalytics.gov")) {
            investigator = userRepository.save(User.builder()
                    .email("investigator@crimeanalytics.gov")
                    .password(passwordEncoder.encode("Invest@123"))
                    .firstName("Lead")
                    .lastName("Investigator")
                    .role(User.Role.INVESTIGATOR)
                    .active(true)
                    .build());
            log.info("Default Investigator user created: investigator@crimeanalytics.gov");
        } else {
            investigator = userRepository.findByEmail("investigator@crimeanalytics.gov").orElse(null);
        }

        if (!userRepository.existsByEmail("supervisor@crimeanalytics.gov")) {
            userRepository.save(User.builder()
                    .email("supervisor@crimeanalytics.gov")
                    .password(passwordEncoder.encode("Super@123"))
                    .firstName("Case")
                    .lastName("Supervisor")
                    .role(User.Role.ANALYST)
                    .active(true)
                    .build());
            log.info("Default Supervisor user created: supervisor@crimeanalytics.gov");
        }

        // Seed initial sample cases if database is empty
        if (caseRepository.count() == 0) {
            log.info("Seeding initial investigative demonstration cases...");

            Case c1 = Case.builder()
                    .caseNumber("FIR-2026-1001")
                    .title("Metropolitan Heights Executive Suite Homicide")
                    .description("Rohan Malhotra, a 32-year-old company executive, was found dead inside his apartment at Metropolitan Heights at approximately 10:15 PM on 19 August 2026. His business partner Vikram Rao had a financial dispute with him over a pending transaction and was reportedly seen arguing with the victim at 8:30 PM. The victim's wife Neha Malhotra claimed that she left the apartment at 8:45 PM to visit her sister and returned at approximately 10:20 PM. CCTV footage showed Arjun Das, a former employee who had recently been dismissed by the victim, entering the apartment building at 9:18 PM and leaving at 9:56 PM. Security contractor Sameer Khan stated that he remained inside the security room throughout the evening, but access-control records showed that his security card was used to enter the victim's floor at 9:42 PM. A neighbour reported hearing a loud argument from the apartment at approximately 9:35 PM followed by the sound of breaking glass. Investigators found a broken glass near the victim, blood stains on the living-room floor, partial fingerprints on the glass, and CCTV footage showing an unidentified person leaving the building shortly before 10:00 PM. The victim's mobile phone and a confidential business file were also missing from the apartment. Preliminary investigation suggests that the crime may have been motivated by financial conflict, revenge, or an attempt to obtain confidential information. The conflicting statements, CCTV footage, access-card records, and physical evidence require further investigation to identify the primary suspect and reconstruct the exact sequence of events.")
                    .status(Case.CaseStatus.UNDER_INVESTIGATION)
                    .type(Case.CaseType.HOMICIDE)
                    .priority(Case.PriorityLevel.CRITICAL)
                    .locationName("Metropolitan Heights")
                    .incidentDate(LocalDate.now().minusDays(1))
                    .createdBy(investigator != null ? investigator : admin)
                    .build();
            c1 = caseRepository.save(c1);
            aiPipelineService.analyzeCase(c1);

            Case c2 = Case.builder()
                    .caseNumber("FIR-2026-1002")
                    .title("Central Bank High-Precision Vault Heist")
                    .description("Vault manager Robert Chen reported $3.5M cash missing. CCTV recorded suspect Marcus Vance entering secondary corridor at 09:15 AM wearing dark overalls. Security guard Leo Torres claimed he was patrolling floor 2, but corridor camera 4 was manually disabled at 09:22 AM. Access logs showed keycard 4092 assigned to technician Elena Rostova was used on vault door at 09:28 AM.")
                    .status(Case.CaseStatus.UNDER_INVESTIGATION)
                    .type(Case.CaseType.ROBBERY)
                    .priority(Case.PriorityLevel.HIGH)
                    .locationName("Central Plaza Financial District")
                    .incidentDate(LocalDate.now().minusDays(2))
                    .createdBy(investigator != null ? investigator : admin)
                    .build();
            c2 = caseRepository.save(c2);
            aiPipelineService.analyzeCase(c2);

            Case c3 = Case.builder()
                    .caseNumber("FIR-2026-1003")
                    .title("Municipal Power Grid Ransomware Breach")
                    .description("Senior SCADA engineer Alex Mercer logged into control server at 11:45 PM. Unknown threat actor deployed LockBit ransomware demanding 50 BTC. Systems administrator Priya Sharma reported credential leakage. Server access logs showed employee David Miller's VPN token was active from unauthorized IP 185.220.101.4 at 02:15 AM.")
                    .status(Case.CaseStatus.UNDER_INVESTIGATION)
                    .type(Case.CaseType.CYBER_CRIME)
                    .priority(Case.PriorityLevel.CRITICAL)
                    .locationName("Municipal Operations Control Center")
                    .incidentDate(LocalDate.now().minusDays(3))
                    .createdBy(investigator != null ? investigator : admin)
                    .build();
            c3 = caseRepository.save(c3);
            aiPipelineService.analyzeCase(c3);

            log.info("Demo cases seeded and AI analyzed successfully.");
        }
    }
}
