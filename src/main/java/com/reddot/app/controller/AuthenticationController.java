package com.reddot.app.controller;

import com.reddot.app.authentication.dto.LoginRequest;
import com.reddot.app.authentication.dto.RegisterRequest;
import com.reddot.app.dto.ServiceResponse;
import com.reddot.app.entity.User;
import com.reddot.app.exception.ResourceNotFoundException;
import com.reddot.app.service.user.UserServiceManager;
import com.reddot.app.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// FIXME: implement validation
@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private final JwtUtil jwtUtil;

    private final UserServiceManager manager;

    private final AuthenticationManager authenticationManager;

    public AuthenticationController(JwtUtil jwtUtil, UserServiceManager manager, AuthenticationManager authenticationManager) {
        this.jwtUtil = jwtUtil;
        this.manager = manager;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/login")
    public String createAuthenticationToken(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            // Authenticate user by creating new empty context and to avoid race conditions across multiple threads.
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            final UserDetails userDetails = manager.loadUserByUsername(request.getUsername());
            return jwtUtil.generateToken(userDetails);
        } catch (Exception e) {
            throw new ResourceNotFoundException(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ServiceResponse<User>> register(@Valid @RequestBody RegisterRequest request) { // @Valid: validate the request body and throw Bad Request if invalid
        try {
            manager.createNewUser(request);
            return new ResponseEntity<>(new ServiceResponse<>(HttpStatus.CREATED.value(), "Check email box to confirm account registration or you may want to check spam folder"), HttpStatus.CREATED);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    @GetMapping("/confirm-account")
    public ResponseEntity<ServiceResponse<User>> confirm(@RequestParam("token") String token) {
        try {
            User user = manager.confirmNewUser(token);
            return new ResponseEntity<>(new ServiceResponse<>(HttpStatus.OK.value(), "Congratulations! Your account has been confirmed", user), HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException(e.getMessage());
        }
    }
}