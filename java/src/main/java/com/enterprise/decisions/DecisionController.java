package com.enterprise.decisions;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class DecisionController {
    private final Prioritization service;
    public DecisionController(Prioritization service) { this.service = service; }
    @PostMapping("/engine/prioritize")
    public Prioritization.Portfolio prioritize(@Valid @RequestBody Prioritization.Request request) { return service.calculate(request); }
    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
    public ResponseEntity<Map<String, Object>> invalid(Exception exception) {
        return ResponseEntity.badRequest().body(Map.of("status", 400, "title", "Invalid prioritization input."));
    }
}
