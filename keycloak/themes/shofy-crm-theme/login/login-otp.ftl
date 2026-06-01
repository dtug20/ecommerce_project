<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('totp'); section>

    <#if section = "header">
    <#elseif section = "form">

    <#-- Critical OTP layout CSS inlined so the 6-digit boxes render horizontally
         and the shield circle shows even if the external crm-otp.css fails to link
         (e.g. a stale cached theme.properties). Uses !important to defeat the
         PatternFly form-grid/form-control rules from the parent keycloak.v2 theme. -->
    <style>
        .crm-otp-shield {
            width: 88px; height: 88px; margin: 0 auto 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(164,44,72,0.08), rgba(164,44,72,0.16));
            display: flex; align-items: center; justify-content: center;
        }
        #crm-otp-boxes, .crm-otp-boxes {
            display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important;
            align-items: center !important; justify-content: center !important;
            gap: 10px !important; margin: 10px 0 6px !important; padding: 0 !important;
            width: 100% !important; max-width: 100% !important;
        }
        #crm-otp-boxes .crm-otp-box, .crm-otp-boxes .crm-otp-box, input.crm-otp-box {
            display: inline-block !important;
            width: 44px !important; min-width: 44px !important; max-width: 44px !important;
            height: 56px !important; flex: 0 0 44px !important; padding: 0 !important;
            border: 1.5px solid #e5e7eb !important; border-radius: 10px !important;
            background: #ffffff !important;
            font-family: 'SF Mono','Menlo','Consolas',monospace !important;
            font-size: 22px !important; font-weight: 600 !important; color: #111827 !important;
            text-align: center !important; outline: none !important;
            transition: border-color .18s, box-shadow .18s, transform .18s !important;
            caret-color: #a42c48 !important; box-shadow: 0 1px 2px rgba(17,24,39,0.04) !important;
            appearance: none !important; -webkit-appearance: none !important;
        }
        #crm-otp-boxes .crm-otp-box:hover, .crm-otp-boxes .crm-otp-box:hover { border-color: #d1d5db !important; }
        #crm-otp-boxes .crm-otp-box:focus, .crm-otp-boxes .crm-otp-box:focus {
            border-color: #a42c48 !important;
            box-shadow: 0 0 0 3px rgba(164,44,72,0.15) !important; transform: translateY(-1px) !important;
        }
        #crm-otp-boxes .crm-otp-box[value]:not([value=""]) { border-color: #a42c48 !important; background: #fff8fa !important; }
        .crm-otp-divider {
            display: inline-flex !important; align-items: center; justify-content: center;
            color: #d1d5db !important; font-size: 22px; font-weight: 700; user-select: none;
            margin: 0 2px !important; width: 8px; flex: 0 0 8px;
        }
        @media (max-width: 480px) {
            #crm-otp-boxes, .crm-otp-boxes { gap: 6px !important; }
            #crm-otp-boxes .crm-otp-box, .crm-otp-boxes .crm-otp-box, input.crm-otp-box {
                width: 38px !important; min-width: 38px !important; max-width: 38px !important;
                height: 50px !important; flex: 0 0 38px !important; font-size: 20px !important;
            }
        }
        @media (max-width: 360px) {
            #crm-otp-boxes, .crm-otp-boxes { gap: 4px !important; }
            #crm-otp-boxes .crm-otp-box, .crm-otp-boxes .crm-otp-box, input.crm-otp-box {
                width: 34px !important; min-width: 34px !important; max-width: 34px !important;
                height: 46px !important; flex: 0 0 34px !important; font-size: 18px !important;
            }
            .crm-otp-divider { margin: 0 1px !important; width: 6px; flex: 0 0 6px; }
        }
    </style>

    <div class="crm-page-wrapper">
        <!-- Left panel — branding -->
        <div class="crm-brand-panel">
            <div class="crm-brand-shapes">
                <div class="crm-shape crm-shape-1"></div>
                <div class="crm-shape crm-shape-2"></div>
                <div class="crm-shape crm-shape-3"></div>
            </div>
            <div class="crm-brand-content">
                <div class="crm-brand-logo">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <polyline points="9 12 11 14 15 10"/>
                    </svg>
                </div>
                <h1 class="crm-brand-title">${msg("crm.otp.brand.title")}</h1>
                <p class="crm-brand-subtitle">${msg("crm.otp.brand.subtitle")}</p>
                <div class="crm-brand-features">
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${msg("crm.otp.brand.feature1")}</span>
                    </div>
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${msg("crm.otp.brand.feature2")}</span>
                    </div>
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${msg("crm.otp.brand.feature3")}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right panel — OTP verification form -->
        <div class="crm-form-panel">
            <div class="crm-login-card">

                <#if realm.internationalizationEnabled && locale.supported?size gt 1>
                <div class="crm-lang-switcher">
                    <button type="button" class="crm-lang-btn" onclick="toggleLangMenu()" aria-haspopup="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span>${locale.current}</span>
                        <svg class="crm-lang-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    <ul class="crm-lang-menu" id="crm-lang-menu" role="menu">
                        <#list locale.supported as sup>
                        <li role="none">
                            <a href="${sup.url}" role="menuitem" class="crm-lang-option <#if sup.languageTag == locale.current>crm-lang-active</#if>">
                                ${sup.label}
                            </a>
                        </li>
                        </#list>
                    </ul>
                </div>
                </#if>

                <!-- Auth shield illustration -->
                <div class="crm-otp-shield">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#a42c48" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                </div>

                <h2 class="crm-form-title">${msg("crm.otp.title")}</h2>
                <p class="crm-form-subtitle">${msg("crm.otp.subtitle")}</p>

                <!-- Error alerts -->
                <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="crm-alert crm-alert-${message.type}">
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>

                <form id="kc-otp-login-form" action="${url.loginAction}" method="post" class="crm-otp-form">

                    <!-- Multiple credential selector (if user has more than one OTP device) -->
                    <#if otpLogin.userOtpCredentials?? && otpLogin.userOtpCredentials?size gt 1>
                    <div class="crm-field">
                        <label class="crm-label">${msg("crm.otp.credentialLabel")}</label>
                        <div class="crm-credential-list">
                            <#list otpLogin.userOtpCredentials as credential>
                            <label class="crm-credential-option<#if credential.id == otpLogin.selectedCredentialId> crm-credential-active</#if>">
                                <input type="radio"
                                       name="selectedCredentialId"
                                       value="${credential.id}"
                                       <#if credential.id == otpLogin.selectedCredentialId>checked</#if> />
                                <span class="crm-credential-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                                        <line x1="12" y1="18" x2="12" y2="18"/>
                                    </svg>
                                </span>
                                <span class="crm-credential-name">${credential.userLabel}</span>
                            </label>
                            </#list>
                        </div>
                    </div>
                    </#if>

                    <!-- 6-digit OTP boxes -->
                    <div class="crm-field">
                        <label class="crm-label" for="otp">${msg("crm.otp.codeLabel")}</label>
                        <div class="crm-otp-boxes" id="crm-otp-boxes">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="crm-otp-box" data-index="0" autocomplete="one-time-code" autofocus aria-label="${msg("crm.otp.digitAria")} 1">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="crm-otp-box" data-index="1" autocomplete="off" aria-label="${msg("crm.otp.digitAria")} 2">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="crm-otp-box" data-index="2" autocomplete="off" aria-label="${msg("crm.otp.digitAria")} 3">
                            <span class="crm-otp-divider">·</span>
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="crm-otp-box" data-index="3" autocomplete="off" aria-label="${msg("crm.otp.digitAria")} 4">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="crm-otp-box" data-index="4" autocomplete="off" aria-label="${msg("crm.otp.digitAria")} 5">
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="crm-otp-box" data-index="5" autocomplete="off" aria-label="${msg("crm.otp.digitAria")} 6">
                        </div>
                        <!-- Hidden field that actually gets submitted -->
                        <input type="hidden" id="otp" name="otp" value="" />
                        <#if messagesPerField.existsError('totp')>
                        <span class="crm-field-error">${kcSanitize(messagesPerField.get('totp'))?no_esc}</span>
                        </#if>
                    </div>

                    <div class="crm-otp-hint">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>${msg("crm.otp.hint")}</span>
                    </div>

                    <div class="crm-button-wrapper">
                        <button class="crm-submit-btn" type="submit" id="kc-login" name="login">
                            ${msg("crm.otp.submit")}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                                <polyline points="12 5 19 12 12 19"/>
                            </svg>
                        </button>
                    </div>

                    <div class="crm-otp-footer-actions">
                        <a class="crm-forgot-link" href="${url.loginRestartFlowUrl}">
                            ${msg("crm.otp.useAnotherWay")}
                        </a>
                    </div>
                </form>

                <div class="crm-footer-text">
                    ${msg("crm.login.footer")}
                </div>
            </div>
        </div>
    </div>

    <script>
        window.CRM_TOAST_TITLES = {
            error:   '${msg("crm.toast.error")}',
            warning: '${msg("crm.toast.warning")}',
            success: '${msg("crm.toast.success")}',
            info:    '${msg("crm.toast.info")}',
        };

        function toggleLangMenu() {
            var switcher = document.querySelector('.crm-lang-switcher');
            switcher.classList.toggle('open');
            document.getElementById('crm-lang-menu').classList.toggle('crm-lang-menu-open');
        }
        document.addEventListener('click', function(e) {
            var switcher = document.querySelector('.crm-lang-switcher');
            if (switcher && !switcher.contains(e.target)) {
                switcher.classList.remove('open');
                var menu = document.getElementById('crm-lang-menu');
                if (menu) menu.classList.remove('crm-lang-menu-open');
            }
        });

        // 6-digit OTP input behavior: auto-advance, backspace, paste, auto-submit
        (function() {
            var boxes = Array.prototype.slice.call(document.querySelectorAll('.crm-otp-box'));
            var hidden = document.getElementById('otp');
            var form = document.getElementById('kc-otp-login-form');

            function syncHidden() {
                hidden.value = boxes.map(function (b) { return b.value || ''; }).join('');
            }

            boxes.forEach(function(box, idx) {
                box.addEventListener('input', function(e) {
                    var v = e.target.value.replace(/\D+/g, '');
                    e.target.value = v.slice(-1);
                    if (e.target.value && idx < boxes.length - 1) {
                        boxes[idx + 1].focus();
                    }
                    syncHidden();
                    if (boxes.every(function (b) { return b.value.length === 1; })) {
                        // Auto-submit when all 6 digits are entered
                        form.submit();
                    }
                });

                box.addEventListener('keydown', function(e) {
                    if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                        boxes[idx - 1].focus();
                        boxes[idx - 1].value = '';
                        syncHidden();
                        e.preventDefault();
                    } else if (e.key === 'ArrowLeft' && idx > 0) {
                        boxes[idx - 1].focus();
                        e.preventDefault();
                    } else if (e.key === 'ArrowRight' && idx < boxes.length - 1) {
                        boxes[idx + 1].focus();
                        e.preventDefault();
                    }
                });

                box.addEventListener('paste', function(e) {
                    e.preventDefault();
                    var data = (e.clipboardData || window.clipboardData).getData('text').replace(/\D+/g, '');
                    if (!data) return;
                    for (var i = 0; i < boxes.length && i < data.length; i++) {
                        boxes[i].value = data[i];
                    }
                    syncHidden();
                    var lastFilled = Math.min(data.length, boxes.length) - 1;
                    if (lastFilled >= 0 && lastFilled < boxes.length - 1) {
                        boxes[lastFilled + 1].focus();
                    } else {
                        boxes[boxes.length - 1].focus();
                    }
                    if (boxes.every(function (b) { return b.value.length === 1; })) {
                        form.submit();
                    }
                });
            });
        })();
    </script>

    </#if>
</@layout.registrationLayout>
