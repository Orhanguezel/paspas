-- Firma silinirken ihracat araştırma geçmişi otomatik kaybolmasın.
ALTER TABLE crm_company_profiles DROP FOREIGN KEY fk_crm_company_profile_customer;
ALTER TABLE crm_company_profiles ADD CONSTRAINT fk_crm_company_profile_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE RESTRICT;
ALTER TABLE crm_company_contacts DROP FOREIGN KEY fk_crm_contact_customer;
ALTER TABLE crm_company_contacts ADD CONSTRAINT fk_crm_contact_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE RESTRICT;
ALTER TABLE crm_company_research DROP FOREIGN KEY fk_crm_research_customer;
ALTER TABLE crm_company_research ADD CONSTRAINT fk_crm_research_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE RESTRICT;
ALTER TABLE crm_company_product_interest DROP FOREIGN KEY fk_crm_product_customer;
ALTER TABLE crm_company_product_interest ADD CONSTRAINT fk_crm_product_customer FOREIGN KEY (customer_id) REFERENCES musteriler(id) ON DELETE RESTRICT;
