package br.com.trampo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrampoApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrampoApplication.class, args);
	}

}
