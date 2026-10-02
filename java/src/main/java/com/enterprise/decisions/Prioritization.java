package com.enterprise.decisions;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class Prioritization {
    public record Candidate(
        @NotBlank String id, @NotBlank String name,
        @Min(1) @Max(5) int people, @Min(1) @Max(5) int process,
        @Min(1) @Max(5) int data, @Min(1) @Max(5) int technology, @Min(1) @Max(5) int target,
        @DecimalMin("1") @DecimalMax("5") double revenue, @DecimalMin("1") @DecimalMax("5") double cost,
        @DecimalMin("1") @DecimalMax("5") double risk, @DecimalMin("1") @DecimalMax("5") double customer,
        @DecimalMin("1") @DecimalMax("5") double feasibility, @PositiveOrZero double alignment,
        @NotNull @DecimalMin("0") BigDecimal investment, @NotBlank String teamType) {}
    public record Request(@NotNull @Size(max=1000) List<@Valid Candidate> candidates, @DecimalMin("0") BigDecimal budget) {}
    public record Result(String id, String name, double maturity, double gap, double impact, double opportunity,
                         double score, String quadrant, BigDecimal investment, String teamType, boolean funded, String reason) {}
    public record Portfolio(List<Result> priorities, BigDecimal budget, BigDecimal allocated, BigDecimal remaining,
                            int strategicBets, String algorithm) {}

    public Portfolio calculate(Request request) {
        if (request.candidates().stream().map(Candidate::id).distinct().count() != request.candidates().size())
            throw new IllegalArgumentException("Duplicate capability identifier.");
        for (var c : request.candidates()) {
            if (!Double.isFinite(c.alignment()) || !Double.isFinite(c.revenue()) || !Double.isFinite(c.cost()) || !Double.isFinite(c.risk()) || !Double.isFinite(c.customer()) || !Double.isFinite(c.feasibility()))
                throw new IllegalArgumentException("Scores must be finite.");
        }
        var scored = request.candidates().stream().map(c -> {
            double maturity = (c.people() + c.process() + c.data() + c.technology()) / 4.0;
            double gap = Math.max(0, c.target() - maturity);
            double impact = c.revenue() * .3 + c.cost() * .25 + c.risk() * .25 + c.customer() * .2;
            double opportunity = gap / 4.0 * c.feasibility();
            double score = impact * opportunity * Math.min(1, c.alignment());
            String quadrant = impact >= 3.5 ? (opportunity >= 2 ? "strategic-bet" : "protect") : (opportunity >= 2 ? "quick-win" : "monitor");
            return new Result(c.id(), c.name(), round(maturity), round(gap), round(impact), round(opportunity), round(score), quadrant, c.investment(), c.teamType(), false, "");
        }).sorted(Comparator.comparingDouble(Result::score).reversed().thenComparing(Result::id)).toList();
        BigDecimal remaining = request.budget();
        BigDecimal allocated = BigDecimal.ZERO;
        var results = new ArrayList<Result>();
        int bets = 0;
        for (var r : scored) {
            boolean eligible = r.score() > 0 && r.investment().signum() > 0;
            boolean funded = eligible && remaining != null && r.investment().compareTo(remaining) <= 0;
            if (funded) { allocated = allocated.add(r.investment()); remaining = remaining.subtract(r.investment()); }
            if (r.quadrant().equals("strategic-bet") && r.score() > 0) bets++;
            String reason = r.score() == 0 ? "Sin brecha de madurez o sin anclaje estratégico." : r.investment().signum() == 0 ? "Falta estimación de inversión." : remaining == null ? "Priorizada; seleccione presupuesto para simular asignación." : funded ? "Incluida por puntuación y presupuesto disponible." : "Fuera del presupuesto disponible.";
            results.add(new Result(r.id(), r.name(), r.maturity(), r.gap(), r.impact(), r.opportunity(), r.score(), r.quadrant(), r.investment(), r.teamType(), funded, reason));
        }
        return new Portfolio(results, request.budget(), allocated, remaining, bets, "weighted-impact-maturity-gap-v1");
    }
    private static double round(double n) { return BigDecimal.valueOf(n).setScale(3, RoundingMode.HALF_UP).doubleValue(); }
}
