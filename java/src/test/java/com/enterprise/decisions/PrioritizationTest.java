package com.enterprise.decisions;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class PrioritizationTest {
    final Prioritization service = new Prioritization();
    Prioritization.Candidate candidate(String id, int maturity, double alignment, int investment) {
        return new Prioritization.Candidate(id, id, maturity, maturity, maturity, maturity, 5, 5, 5, 5, 5, 5, alignment, BigDecimal.valueOf(investment), "stream-aligned");
    }
    @Test void highestGapWinsAndBudgetIsNeverExceeded() {
        var result = service.calculate(new Prioritization.Request(List.of(candidate("low", 4, 1, 30), candidate("high", 1, 1, 80), candidate("middle", 3, 1, 50)), BigDecimal.valueOf(100)));
        assertThat(result.priorities()).extracting(Prioritization.Result::id).containsExactly("high", "middle", "low");
        assertThat(result.allocated()).isEqualByComparingTo("80");
        assertThat(result.remaining()).isEqualByComparingTo("20");
        assertThat(result.priorities()).filteredOn(Prioritization.Result::funded).hasSize(1);
    }
    @Test void unanchoredAndMatureCapabilitiesAreNotFunded() {
        var result = service.calculate(new Prioritization.Request(List.of(candidate("unanchored", 1, 0, 10), candidate("mature", 5, 1, 10)), BigDecimal.valueOf(100)));
        assertThat(result.allocated()).isEqualByComparingTo("0");
        assertThat(result.priorities()).allMatch(r -> r.score() == 0 && !r.funded());
    }
    @Test void tieBreakIsDeterministicAndAlignmentIsCapped() {
        var result = service.calculate(new Prioritization.Request(List.of(candidate("b", 1, 2, 10), candidate("a", 1, 1, 10)), null));
        assertThat(result.priorities()).extracting(Prioritization.Result::id).containsExactly("a", "b");
        assertThat(result.priorities()).allMatch(r -> r.score() == 25);
        assertThat(result.remaining()).isNull();
    }
    @Test void zeroBudgetAndUnestimatedInvestmentRemainUnfunded() {
        var result = service.calculate(new Prioritization.Request(List.of(candidate("free", 1, 1, 0), candidate("estimated", 1, 1, 10)), BigDecimal.ZERO));
        assertThat(result.priorities()).noneMatch(Prioritization.Result::funded);
    }
    @Test void duplicateIdsAreRejected() {
        assertThatThrownBy(() -> service.calculate(new Prioritization.Request(List.of(candidate("a", 1, 1, 10), candidate("a", 2, 1, 10)), null))).isInstanceOf(IllegalArgumentException.class);
    }
}
