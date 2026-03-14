<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username') displayInfo=false; section>

    <#if section = "header">
    <#elseif section = "form">

    <div class="shofy-page-wrapper">
        <div class="shofy-bg-shapes">
            <div class="shofy-shape shofy-shape-1"></div>
            <div class="shofy-shape shofy-shape-2"></div>
            <div class="shofy-shape shofy-shape-3"></div>
            <div class="shofy-shape shofy-shape-4"></div>
        </div>

        <div class="shofy-login-card shofy-reset-card">

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

            <!-- Icon -->
            <div class="shofy-reset-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0989FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            </div>

            <h2 class="shofy-form-title">${msg("shofy.reset.title")}</h2>
            <p class="shofy-form-subtitle">${msg("shofy.reset.subtitle")}</p>

            <form id="kc-reset-password-form" action="${url.loginAction}" method="post">

                <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="shofy-alert shofy-alert-${message.type}">
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>

                <div class="shofy-field">
                    <label class="shofy-label" for="username">${msg("shofy.reset.emailLabel")}</label>
                    <input tabindex="1"
                           id="username"
                           class="shofy-input<#if messagesPerField.existsError('username')> shofy-input-error</#if>"
                           name="username"
                           type="text"
                           autofocus
                           autocomplete="off"
                           placeholder="${msg("shofy.reset.emailPlaceholder")}"
                           oninput="clearEmailError()" />
                    <#if messagesPerField.existsError('username')>
                        <span id="email-error" class="shofy-field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                    <#else>
                        <span id="email-error" class="shofy-field-error" style="display:none;">${msg("shofy.reset.emailInvalid")}</span>
                    </#if>
                </div>

                <div class="shofy-button-wrapper">
                    <button tabindex="2" class="shofy-submit-btn" type="submit">
                        ${msg("shofy.reset.submitBtn")}
                    </button>
                </div>

            </form>

            <div class="shofy-back-link">
                <a tabindex="3" href="${url.loginUrl}<#if locale??>&ui_locales=${locale.current}</#if>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span>${msg("shofy.reset.backToLogin")}</span>
                </a>
            </div>
        </div>
    </div>

    <script>
        window.SHOFY_TOAST_TITLES = {
            error:   '${msg("shofy.toast.error")}',
            warning: '${msg("shofy.toast.warning")}',
            success: '${msg("shofy.toast.success")}',
            info:    '${msg("shofy.toast.info")}',
        };

        var msgEmailRequired = '${msg("shofy.reset.emailRequired")}';
        var msgEmailInvalid  = '${msg("shofy.reset.emailInvalid")}';

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function clearEmailError() {
            document.getElementById('username').classList.remove('shofy-input-error');
            document.getElementById('email-error').style.display = 'none';
        }

        document.getElementById('kc-reset-password-form').addEventListener('submit', function(e) {
            var value = document.getElementById('username').value.trim();
            if (!value) {
                document.getElementById('username').classList.add('shofy-input-error');
                e.preventDefault();
                if (window.shofyToast) window.shofyToast('error', msgEmailRequired);
                return;
            }
            if (!isValidEmail(value)) {
                document.getElementById('username').classList.add('shofy-input-error');
                e.preventDefault();
                if (window.shofyToast) window.shofyToast('error', msgEmailInvalid);
            }
        });

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
    </script>

    </#if>
</@layout.registrationLayout>
