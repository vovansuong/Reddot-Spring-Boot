package com.reddot.app.service.user;

import com.reddot.app.dto.UserProfileDTO;
import com.reddot.app.dto.request.ProfileUpdateRequest;
import com.reddot.app.dto.request.RegisterRequest;
import com.reddot.app.dto.request.UpdateEmailRequest;
import com.reddot.app.dto.request.UpdatePasswordRequest;
import com.reddot.app.entity.*;
import com.reddot.app.entity.enumeration.ROLENAME;
import com.reddot.app.exception.ResourceNotFoundException;
import com.reddot.app.repository.*;
import com.reddot.app.service.email.MailSenderManager;
import com.reddot.app.util.Validator;
import jakarta.validation.Valid;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.time.LocalDateTime;
import java.util.*;

@Log4j2
@Service
public class UserServiceManagerImp implements UserServiceManager {

    private final MailSenderManager mailSenderManager;

    private final UserRepository userRepository;

    private final RoleRepository roleRepository;

    private final PasswordEncoder encoder;

    private final RecoveryTokenRepository recoveryTokenRepository;
    private final ConfirmationTokenRepository confirmationTokenRepository;

    private final String fullUrl;
    private final PersonRepository personRepository;

    public UserServiceManagerImp(@Value("${server.address}") String appDomain,
                                 @Value("${server.port}") String appPort,
                                 @Value("${server.servlet.context-path}") String appPath,
                                 MailSenderManager sender, UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder encoder, RecoveryTokenRepository recoveryTokenRepository, ConfirmationTokenRepository confirmationTokenRepository, PersonRepository personRepository) {
        this.mailSenderManager = sender;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.encoder = encoder;
        this.recoveryTokenRepository = recoveryTokenRepository;
        this.confirmationTokenRepository = confirmationTokenRepository;
        this.fullUrl = "http://" + appDomain + ":" + appPort + appPath;
        this.personRepository = personRepository;
    }


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        List<GrantedAuthority> dbAuths = new ArrayList<>(loadUserAuthorities(username));
//        return createUserDetails(user, dbAuths);
        return user;
    }

    // TODO: Implement this method
    protected List<GrantedAuthority> loadUserAuthorities(String username) {
        Assert.notNull(username, "Username is null");
        List<GrantedAuthority> dbAuths = new ArrayList<>();
        dbAuths.add(new SimpleGrantedAuthority("ROLE_USER"));
        return dbAuths;
    }

    // Helper method
    protected UserDetails createUserDetails(User userFromDb, List<GrantedAuthority> combinedAuthorities) {
        String returnUsername = userFromDb.getUsername();
        return new org.springframework.security.core.userdetails.User(returnUsername, userFromDb.getPassword(), userFromDb.isEnabled(), userFromDb.isAccountNonExpired(), userFromDb.isCredentialsNonExpired(), userFromDb.isAccountNonLocked(), combinedAuthorities);
    }

    @Override
    public void createNewUser(RegisterRequest request) {
        try {
            if (userExistsByUsername(request.getUsername())) {
                throw new Exception("USER_ALREADY_EXISTS");
            }
            List<String> errorMessages = validateUser(request);
            if (!errorMessages.isEmpty()) {
                log.error(String.valueOf(errorMessages));
                throw new Exception(String.valueOf(errorMessages));
            }
            User user = new User(request.getUsername(), request.getEmail(),
                    encoder.encode(request.getPassword())
            );
            Set<Role> roles = getRolesByString(request.getRoles());
            user.setRoles(roles);
            userRepository.save(user);

            // Send confirmation email
            Assert.notNull(user.getId(), "User id must not be null");
            ConfirmationToken token = new ConfirmationToken(user.getId());
            String subject = "Reddot account confirmation";
            String body = "Hi there,\n\n" +
                    "To confirm your account, click the link below:\n"
                    + fullUrl + "/auth/confirm-account?token=" + token.getToken();
            mailSenderManager.sendEmail(user.getEmail(), subject, body);

            // Save confirmation token
            confirmationTokenRepository.save(token);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public UserProfileDTO confirmNewUser(String token) {
        try {
            ConfirmationToken confirmationToken = confirmationTokenRepository.findByToken(token).orElseThrow(() -> new ResourceNotFoundException("TOKEN_NOT_FOUND"));
            if (confirmationToken.getConfirmedAt() != null) {
                throw new Exception("EMAIL_ALREADY_CONFIRMED");
            }
            User user = getUser(confirmationToken.getOwnerId());
            user.setEnabled(true);
            user.setEmailVerified(true);

            // Create user profile
            Person person = new Person(user.getUsername());
            user.setPerson(person);
            userRepository.save(user);

            // update confirm token
            confirmationToken.setConfirmedAt(LocalDateTime.now());
            confirmationTokenRepository.save(confirmationToken);

            // return safely DTO
            UserProfileDTO dto = new UserProfileDTO();
            dto.builder(user, person);
            return dto;
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException(e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void resetPassword(UpdatePasswordRequest request) {
        try {
            RecoveryToken recoveryToken = recoveryTokenRepository.findByToken(request.getToken()).orElseThrow(() -> new ResourceNotFoundException("TOKEN_NOT_FOUND"));
            if (!Validator.isPasswordValid(request.getPassword())) {
                throw new Exception("INVALID_PASSWORD_FORMAT");
            }
            if (recoveryToken.isUsed()) {
                throw new Exception("TOKEN_ALREADY_USED");
            }
            if (recoveryToken.getValidBefore().isBefore(LocalDateTime.now())) {
                throw new Exception("TOKEN_EXPIRED");
            }
            User user = getUser(recoveryToken.getOwnerId());
            user.setPassword(encoder.encode(request.getPassword()));
            userRepository.save(user);
            recoveryToken.setUsed(true);
            recoveryTokenRepository.save(recoveryToken);

            // send email
            String subject = "Reddot password reset successful";
            String body = """
                    Hi there,
                    
                    Your password has been reset successfully.
                    """;
            mailSenderManager.sendEmail(user.getEmail(), subject, body);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void sendUpdateEmail(String newEmail) {

    }

    @Override
    public void confirmNewEmail(UpdateEmailRequest request) {

    }

    @Override
    public boolean isOwner(String username, Integer id) {
        try {
            User user = getUserByUsername(username);
            return Objects.equals(user.getId(), id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void sendPasswordResetEmail(String email) {
        try {
            if (userExistsByEmail(email)) {
                User user = getUser(email);

                // send password reset email
                RecoveryToken recoveryToken = new RecoveryToken();
                recoveryToken.setOwnerId(user.getId());
                recoveryToken.setToken(UUID.randomUUID().toString());
                LocalDateTime validBefore = LocalDateTime.now().plusHours(24);
                recoveryToken.setValidBefore(validBefore);

                // send password reset email
                String subject = "Reddot password reset";
                String body = "Hi there,\n\n" +
                        "To reset your password, click the link below:\n"
                        + fullUrl + "/reset-password?token=" + recoveryToken.getToken();
                mailSenderManager.sendEmail(email, subject, body);

                // save recovery token
                recoveryTokenRepository.save(recoveryToken);
            }
        } catch (ResourceNotFoundException e) {
            throw new ResourceNotFoundException(e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public UserProfileDTO getUserProfile(String username) {
        try {
            User user = getUserByUsername(username);
            Optional<Person> p = personRepository.findByUserId(user.getId());
            Person person;

            if (p.isPresent()) {
                person = p.get();
            } else {
                person = new Person(user.getUsername());
                user.setPerson(person);
                userRepository.save(user);
            }

            UserProfileDTO dto = new UserProfileDTO();
            dto.builder(user, person);
            return dto;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public UserProfileDTO updateProfile(Integer userId, @Valid ProfileUpdateRequest updateRequest) {
        try {
            User user = getUser(userId);
            user.setAvatarUrl(updateRequest.getAvatar());
            Person person = personRepository.findByUserId(user.getId()).orElse(new Person(user.getUsername()));

            // FIXME: make code clean
            // Update person from DTO
            person.setDisplayName(updateRequest.getDisplayName());
            person.setAboutMe(updateRequest.getAboutMe());
            person.setDob(updateRequest.getDob());
            person.setLocation(updateRequest.getLocation());
            person.setWebsiteUrl(updateRequest.getWebsiteUrl());

            user.setPerson(person);
            userRepository.save(user);
            log.info("User profile updated successfully");

            UserProfileDTO dto = new UserProfileDTO();
            dto.builder(user, person);
            return dto;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private boolean userExistsByUsername(String username) {
        Assert.notNull(username, "Username is null");
        return userRepository.findByUsername(username).isPresent();
    }

    private boolean userExistsByEmail(String email) {
        Assert.notNull(email, "Email is null");
        return userRepository.findByEmail(email).isPresent();
    }

    private User getUser(Integer ownerId) {
        return userRepository.findById(ownerId).orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND"));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND"));
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND"));
    }

    private Set<Role> getRolesByString(Set<String> strRoles) {
        Set<Role> roles = new HashSet<>();
        try {
            if (strRoles == null || strRoles.isEmpty()) {
                roles.add(findRoleByName(ROLENAME.ROLE_USER));
            } else {
                strRoles.forEach(role -> {
                    switch (role) {
                        case "ROLE_ADMIN":
                            roles.add(findRoleByName(ROLENAME.ROLE_ADMIN));
                            break;
                        case "ROLE_MODERATOR":
                            roles.add(findRoleByName(ROLENAME.ROLE_MODERATOR));
                            break;
                        default:
                            roles.add(findRoleByName(ROLENAME.ROLE_USER));
                            break;
                    }
                });
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return roles;
    }

    private Role findRoleByName(ROLENAME roleName) {
        return roleRepository.findByName(roleName).orElse(null);
    }


    private List<String> validateUser(RegisterRequest user) {
        List<String> messages = new ArrayList<>();
        if (!Validator.isUsernameValid(user.getUsername())) {
            messages.add("Invalid Username Format");
        } else if (userRepository.existsByUsername(user.getUsername())) {
            messages.add("Username already exists in the system!");
        }

        if (!Validator.isEmailValid(user.getEmail())) {
            messages.add("Invalid Email Format");
        } else if (userRepository.existsByEmail(user.getEmail())) {
            messages.add("Email already exists in the system");
        }

        if (!Validator.isPasswordValid(user.getPassword())) {
            messages.add("Invalid Password Format");
        }

        return messages;
    }
}
