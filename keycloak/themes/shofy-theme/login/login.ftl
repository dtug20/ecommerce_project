<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

    <#if section = "header">
    <#elseif section = "form">

    <div class="shofy-page-wrapper">
        <div class="shofy-bg-shapes">
            <div class="shofy-shape shofy-shape-1"></div>
            <div class="shofy-shape shofy-shape-2"></div>
            <div class="shofy-shape shofy-shape-3"></div>
            <div class="shofy-shape shofy-shape-4"></div>
        </div>

        <div class="shofy-login-card">

            <#if realm.internationalizationEnabled && locale.supported?size gt 1>
            <div class="shofy-lang-switcher">
                <button type="button" class="shofy-lang-btn" onclick="toggleLangMenu()" aria-haspopup="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>${locale.current}</span>
                    <svg class="shofy-lang-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
                <ul class="shofy-lang-menu" id="shofy-lang-menu" role="menu">
                    <#list locale.supported as sup>
                    <li role="none">
                        <a href="${sup.url}" role="menuitem" class="shofy-lang-option <#if sup.languageTag == locale.current>shofy-lang-active</#if>">
                            ${sup.label}
                        </a>
                    </li>
                    </#list>
                </ul>
            </div>
            </#if>

            <!-- Logo -->
            <div class="shofy-logo">
                <svg width="120" height="36" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="28" font-family="Jost, sans-serif" font-size="30" font-weight="700" fill="#010F1C">Shofy</text>
                </svg>
            </div>

            <h2 class="shofy-form-title">${msg("shofy.login.title")}</h2>
            <p class="shofy-form-subtitle">
                ${msg("shofy.login.subtitle")}
                <#if realm.registrationAllowed && !registrationDisabled??>
                    <a href="${url.registrationUrl}<#if locale??>&ui_locales=${locale.current}</#if>">${msg("shofy.login.registerLink")}</a>
                </#if>
            </p>

            <#if social.providers?? && social.providers?size gt 0>
            <div class="shofy-social-login">
                <#list social.providers as p>
                <a href="${p.loginUrl}" class="shofy-social-btn shofy-social-${p.alias}" id="social-${p.alias}">
                    <#if p.alias == "google">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </#if>
                    <span>${p.displayName}</span>
                </a>
                </#list>
            </div>

            <div class="shofy-divider">
                <span>${msg("shofy.login.orEmail")}</span>
            </div>
            </#if>

            <form id="kc-form-login" onsubmit="login.disabled = true; return true;"
                  action="${url.loginAction}" method="post">

                <!-- Email/Username -->
                <div class="shofy-field">
                    <label class="shofy-label" for="username">${msg("shofy.login.usernameLabel")}</label>
                    <div class="shofy-input-wrapper">
                        <input tabindex="1"
                               id="username"
                               class="shofy-input<#if messagesPerField.existsError('username')> shofy-input-error</#if>"
                               name="username"
                               value="${(login.username!'')}"
                               type="text"
                               autofocus
                               autocomplete="off"
                               placeholder="${msg("shofy.login.usernamePlaceholder")}" />
                    </div>
                </div>

                <!-- Password -->
                <div class="shofy-field">
                    <label class="shofy-label" for="password">${msg("shofy.login.passwordLabel")}</label>
                    <div class="shofy-input-wrapper shofy-password-wrapper">
                        <input tabindex="2"
                               id="password"
                               class="shofy-input"
                               name="password"
                               type="password"
                               autocomplete="off"
                               placeholder="${msg("shofy.login.passwordPlaceholder")}" />
                        <button type="button" class="shofy-toggle-password" onclick="togglePassword()" tabindex="3" aria-label="${msg("shofy.login.togglePasswordAria")}">
                            <svg class="shofy-eye-icon" id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Error alerts -->
                <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="shofy-alert shofy-alert-${message.type}">
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>

                <!-- Remember me + Forgot -->
                <div class="shofy-form-options">
                    <#if realm.rememberMe && !usernameHidden??>
                    <label class="shofy-checkbox">
                        <input tabindex="4" id="rememberMe" name="rememberMe" type="checkbox"
                               <#if login.rememberMe??>checked</#if>>
                        <span class="shofy-checkmark"></span>
                        ${msg("shofy.login.rememberMe")}
                    </label>
                    </#if>

                    <#if realm.resetPasswordAllowed>
                    <a tabindex="5" class="shofy-forgot-link" href="${url.loginResetCredentialsUrl}<#if locale??>&ui_locales=${locale.current}</#if>">
                        ${msg("shofy.login.forgotPassword")}
                    </a>
                    </#if>
                </div>

                <!-- Submit -->
                <div class="shofy-button-wrapper">
                    <input type="hidden" id="id-hidden-input" name="credentialId"
                           <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <button tabindex="6" class="shofy-submit-btn" name="login" id="kc-login" type="submit">
                        ${msg("shofy.login.submitBtn")}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        window.SHOFY_TOAST_TITLES = {
            error:   '${msg("shofy.toast.error")}',
            warning: '${msg("shofy.toast.warning")}',
            success: '${msg("shofy.toast.success")}',
            info:    '${msg("shofy.toast.info")}',
        };

        function toggleLangMenu() {
            var switcher = document.querySelector('.shofy-lang-switcher');
            switcher.classList.toggle('open');
            document.getElementById('shofy-lang-menu').classList.toggle('shofy-lang-menu-open');
        }
        document.addEventListener('click', function(e) {
            var switcher = document.querySelector('.shofy-lang-switcher');
            if (switcher && !switcher.contains(e.target)) {
                switcher.classList.remove('open');
                document.getElementById('shofy-lang-menu').classList.remove('shofy-lang-menu-open');
            }
        });

        function togglePassword() {
            var input = document.getElementById('password');
            var icon = document.getElementById('eyeIcon');
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            } else {
                input.type = 'password';
                icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
            }
        }
    </script>

    </#if>
</@layout.registrationLayout>
