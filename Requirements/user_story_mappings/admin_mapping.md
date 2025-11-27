# Admin User Story Mapping

## Activities
| Legal Compliance | Security Management | Access Control |
|---|---|---|

## MVP
- Maintain GDPR Compliance  
    - Implement consent collection  
        - Display consent prompt  
        - Store consent record  
    - Manage data requests  
        - Export user data  
        - Delete user data  
    - Update privacy policy
        - change privacy policy page
        - send email to all contributors  

- Manage Security  
    - Block malicious IPs  
        - Identify suspicious activity  
        - Add IP to blocklist  
        - Unblock if necessary  

- Manage User Access  
    - Assign roles  
        - Add moderator role  
        - Revoke moderator role  
    - Control permissions  
        - Adjust access per role  
        - Review audit logs  

## R1

- Manage Security  
    - View security dashboard  
        - Display blocked IPs  
        - Show active sessions  

- Manage User Access  
    - Bulk role management  
        - Assign roles in batch  
        - Import/export user permissions  

## R2
- Maintain GDPR Compliance  
    - Automate consent tracking  
        - Auto-update consent status  
        - Generate compliance reports  

- Manage Security 
    - Apply system updates  
        - Review update logs  
        - Schedule downtime  
        - Confirm update success
    - Threat detection  
        - Detect brute-force attacks  
        - Auto-block attackers  

## Use Cases
- As an admin, I want to manage user access so that moderators and users have correct permissions.  
- As an admin, I want to block malicious IPs so that I can prevent attacks and keep the platform secure.  
- As an admin, I want to maintain GDPR compliance so that the platform operates legally.  