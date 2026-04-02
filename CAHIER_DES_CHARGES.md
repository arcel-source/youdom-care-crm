# Cahier des Charges — CRM Youdom Care
## Service d'Aide à Domicile

**Date:** 2 Avril 2026
**Client:** Youdom Care — Aide à domicile Paris 12e

---

## 1. Contexte, objectifs et enjeux

**Activité:** Services d'aide et de maintien à domicile pour personnes âgées, en situation de handicap, en perte d'autonomie, garde d'enfants en situation de handicap, présence de nuit, aide ménagère, accompagnement, etc.

**Enjeux métier:**
- Centraliser toute la relation client (bénéficiaires, familles, prescripteurs, financiers)
- Assurer un suivi personnalisé et humain tout au long du parcours
- Gérer les planifications d'intervenants, la coordination médical/paramédical, et la conformité réglementaire (APA, PCH, SAD)

**Objectif du CRM:**
- Unifier les données clients, bénéficiaires, intervenants, prescripteurs et financiers
- Piloter la qualité de service, la conformité et la performance commerciale depuis une seule plateforme

---

## 2. Périmètre fonctionnel global

1. Gestion des acteurs (contacts, bénéficiaires, familles, prescripteurs, intervenants, partenaires, financiers)
2. Gestion du parcours client/bénéficiaire (demande initiale → suivi long terme)
3. Gestion des services et prestations
4. Gestion des plannings d'interventions
5. Gestion des aspects médico-sociaux et réglementaires (APA, PCH, SAD, MDPH)
6. Gestion commerciale et facturation / suivi des prises en charge
7. Suivi qualité, réclamations, incidents, enquêtes de satisfaction
8. Automatisation de la communication (emails, SMS, notifications internes)
9. Analytique & reporting

---

## 3. Gestion des données et des acteurs

### 3.1 Fiche « Bénéficiaire »
- Identité: civilité, nom, prénom, date de naissance, numéro de sécurité sociale (crypté)
- Coordonnées: adresse, étage, digicode, ville, coordonnées GPS, téléphone fixe, portable, email
- Profil: type de public (personne âgée, handicap, enfant handicapé, malade), niveau de dépendance, type de handicap
- Aides et dispositifs: APA (GIR, montant, dates), PCH (type, volume heures, validité), mutuelles, caisses retraite, ASH
- Dossier médico-social: pathologies, consignes, restrictions, professionnels de santé référents
- Contrat / prise en charge: type contrat, date début, volume heures, type prestations
- Personnes à prévenir / aidants: coordonnées proches, niveau d'implication
- Historique: interventions, incidents, réclamations, modifications plan d'aide

### 3.2 Fiche « Famille / Aidant »
- Lié à un ou plusieurs bénéficiaires
- Coordonnées complètes, préférence de canal
- Rôle (enfant, conjoint, tuteur, curateur)
- Autorisations (signature contrat, décisions, accès portail)

### 3.3 Fiche « Intervenant à domicile »
- Infos RH: identité, coordonnées, type contrat, statut, poste
- Compétences: diplôme (DEAVS, AES), expériences, formations
- Disponibilités: jours, plages horaires, secteur géographique, moyens de transport
- Contraintes: pas de nuits, pas de transferts lourds, animaux, etc.
- Suivi: historique affectations, retours qualité, absences, remplacements

### 3.4 Prescripteurs et partenaires
- Assistantes sociales, hôpitaux, cliniques, CLIC, MDPH, CCAS
- EHPAD, résidences autonomie, associations, services médicaux
- Gestion des relations: source de leads, notes, rendez-vous, historique

### 3.5 Financeurs
- Conseils départementaux (APA), MDPH (PCH), caisses retraite, mutuelles
- Conditions de prise en charge (taux, plafond, justificatifs, périodicité)

---

## 4. Parcours client / bénéficiaire

### 4.1 Capture des demandes
- Intégration formulaire site web
- Création automatique fiche lead
- Tracking source (site, Google Ads, prescripteur, appel, bouche-à-oreille)

### 4.2 Qualification et étude de besoins
- Workflow: appel découverte → visite domicile → recueil infos APA/PCH → évaluation autonomie
- Modèles de compte-rendu de visite (checklist)
- Proposition plan d'aide: volume heures, type prestations, fréquence, horaires

### 4.3 Devis, contrat, démarrage
- Génération semi-automatique devis/contrats
- Suivi statut (envoyé, accepté, en attente aide, refusé)
- Date démarrage, assignation intervenant principal + remplaçants

### 4.4 Suivi continu
- Journal des interventions (prévu/réalisé), commentaires intervenants, remarques familles
- Gestion évolutions: augmentation/réduction heures, changement prestation
- Historique complet par bénéficiaire

---

## 5. Gestion des prestations et plannings

### 5.1 Catalogue de services
- Aide à l'autonomie (lever, coucher, toilette, habillage, repas)
- Aide ménagère
- Présence de nuit / garde de jour
- Accompagnement (courses, médical, loisirs, sorties)
- Garde d'enfants en situation de handicap
- Par service: durée unitaire, tarif horaire, conditions spécifiques

### 5.2 Planification bénéficiaires
- Vue calendrier par bénéficiaire
- Gestion récurrences (hebdo, mensuelle, jours spécifiques)
- Historique modifications

### 5.3 Planification intervenants
- Vue par intervenant: interventions, adresses, temps trajet estimés
- Vérification automatique: conflits horaires, contraintes légales, cohérence géographique
- Gestion absences et remplacements

### 5.4 Pointage / télégestion (option)
- Badgeuse, téléphone fixe, application mobile
- Vérification écarts prévus/réalisés, remontée anomalies

---

## 6. Aspect médico-social et conformité
- Gestion APA/PCH, dates validité, plafonds, alertes fin droits
- Suivi documents: notifications attribution, décisions MDPH, contrats, avenants
- Traçabilité visites évaluation, projets personnalisés
- Conformité SAD: traçabilité aides, coordination soins

---

## 7. Qualité, incidents et réclamations
- Module événements qualité: réclamations, incidents, signaux faibles
- Flux: création ticket, priorité, responsable, date limite, historique, clôture
- Enquêtes satisfaction (email/SMS, téléphone) avec scoring

---

## 8. Communication et automatisation
- Emails et SMS: confirmation service, rappels RDV, alertes absence/retard
- Modèles personnalisables par type d'acteur
- Historique communications centralisé
- Intégration Brevo, Twilio via API

---

## 9. Facturation et suivi financier
- Tarifs par service, horaire, nuit/jour, WE/jours fériés
- Prise en compte: partie financeur + reste à charge famille
- Génération pré-factures / exports comptables
- Suivi encaissements et impayés
- Rapports: CA par service, marge, répartition financement

---

## 10. Reporting & tableaux de bord
- Activité: bénéficiaires, heures planifiées/réalisées, taux occupation intervenants
- Qualité: incidents, réclamations, délai traitement, satisfaction
- Commercial: leads, taux conversion, délai premier contact → démarrage
- Financier: CA mensuel par service, zone, source financement
- Réglementaire: APA/PCH fin droits, dossiers à réévaluer

---

## 11. Exigences techniques
- CRM 100% web, responsive (PC, tablette, mobile intervenants)
- API ouverte pour: site web, messagerie, paie/comptabilité, télégestion
- Architecture évolutive, cloud, sauvegardes, haute disponibilité

---

## 12. Sécurité, RGPD et droits d'accès
- Chiffrement données sensibles (santé, handicap)
- Conformité RGPD
- Rôles: Administrateur, Direction/coordination, Qualité référente, Intervenant (accès limité), Comptabilité

---

## 13. Interfaces spécifiques
- Portail familles & bénéficiaires (phase 2): planning, messages, documents, factures
- Portail intervenants: planning, fiches synthétiques, pointage, compte-rendu

---

## 14. Feuille de route MVP → Version ultime

### MVP (priorité haute)
1. Gestion fiches acteurs (bénéficiaires, familles, intervenants, prescripteurs)
2. Parcours lead → bénéficiaire (formulaire web, qualification, plan d'aide, démarrage)
3. Planification bénéficiaires/intervenants de base
4. Module communication (emails de base)
5. Tableau de bord activité simple

### Version avancée
1. Gestion complète APA/PCH, alertes réglementaires
2. Télégestion/pointage, optimisation plannings
3. Portails familles et intervenants
4. Module qualité complet
5. Reporting avancé et exports comptables/paie
