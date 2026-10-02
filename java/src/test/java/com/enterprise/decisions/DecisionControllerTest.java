package com.enterprise.decisions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
class DecisionControllerTest {
    @Autowired MockMvc mvc;
    @Test void healthAndEmptyPortfolioAreAvailable() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(post("/engine/prioritize").contentType("application/json").content("{\"candidates\":[],\"budget\":100}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.remaining").value(100));
    }
    @Test void negativeBudgetAndOutOfBoundsScoresAreRejected() throws Exception {
        mvc.perform(post("/engine/prioritize").contentType("application/json").content("{\"candidates\":[],\"budget\":-1}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/engine/prioritize").contentType("application/json").content("""
            {"candidates":[{"id":"a","name":"A","people":0,"process":2,"data":2,"technology":2,"target":4,"revenue":3,"cost":3,"risk":3,"customer":3,"feasibility":3,"alignment":1,"investment":100,"teamType":"platform"}]}
            """)).andExpect(status().isBadRequest());
    }
}
