<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>

    <#if section = "header">
    <#elseif section = "form">

    <div class="shofy-page-wrapper">
        <div class="shofy-bg-shapes">
            <div class="shofy-shape shofy-shape-1"></div>
            <div class="shofy-shape shofy-shape-2"></div>
        </div>

        <div class="shofy-login-card shofy-info-card">

            <div class="shofy-info-icon">
                <#if message?has_content && message.type == 'success'>
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#31B757" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <#elseif message?has_content && message.type == 'error'>
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#FD4B6B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <#elseif message?has_content && message.type == 'warning'>
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#FFB342" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <#else>
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0989FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                </#if>
            </div>

            <h2 class="shofy-form-title shofy-info-title">
                <#if message?has_content && message.type == 'success'>${msg("shofy.info.success")}
                <#elseif message?has_content && message.type == 'error'>${msg("shofy.info.error")}
                <#elseif message?has_content && message.type == 'warning'>${msg("shofy.info.warning")}
                <#else>${msg("shofy.info.info")}
                </#if>
            </h2>

            <#if message?has_content>
            <p class="shofy-info-message">${kcSanitize(message.summary)?no_esc}</p>
            </#if>

            <div class="shofy-info-actions">
                <#if skipLink??>
                <#elseif pageRedirectUri?has_content>
                    <a href="${pageRedirectUri}" class="shofy-submit-btn shofy-info-btn">${msg("shofy.info.back")}</a>
                <#elseif actionUri?has_content>
                    <a href="${actionUri}" class="shofy-submit-btn shofy-info-btn">${kcSanitize(message.summary)?no_esc}</a>
                <#elseif (client.baseUrl)?has_content>
                    <a href="${client.baseUrl}" class="shofy-submit-btn shofy-info-btn">${msg("shofy.info.backToHome")}</a>
                </#if>
            </div>
        </div>
    </div>

    </#if>
</@layout.registrationLayout>
