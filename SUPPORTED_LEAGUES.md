# Ligues Supportées - CouponFoot

## 🏆 Compétitions Disponibles

CouponFoot supporte actuellement **9 compétitions majeures** grâce à l'API gratuite Football-Data.org :

### Ligues Nationales Européennes

| Ligue | Pays | Équipes | ID API |
|-------|------|---------|--------|
| 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **Premier League** | Angleterre | 20 | 2021 |
| 🇪🇸 **La Liga** | Espagne | 20 | 2014 |
| 🇩🇪 **Bundesliga** | Allemagne | 18 | 2002 |
| 🇮🇹 **Serie A** | Italie | 20 | 2019 |
| 🇫🇷 **Ligue 1** | France | 18 | 2015 |
| 🇳🇱 **Eredivisie** | Pays-Bas | 18 | 2003 |
| 🇵🇹 **Liga Portugal** | Portugal | 18 | 2017 |

### Compétitions UEFA

| Compétition | Type | ID API |
|-------------|------|--------|
| ⚽ **Champions League** | Continental | 2001 |
| ⚽ **Europa League** | Continental | 2146 |

---

## 📊 Statistiques

- **Total de ligues** : 9
- **Total d'équipes** : ~160+
- **Matchs par semaine** : 100-150
- **Analyses disponibles** : 1000+ par semaine

---

## ✅ Ce qui est inclus

### Pour chaque ligue :
- ✅ **Calendrier complet** (fixtures)
- ✅ **Classements en direct**
- ✅ **Informations équipes**
- ✅ **Statistiques matchs**
- ✅ **Cotes bookmakers** (via scraping)
- ✅ **Analyses IA prédictives**

### Données disponibles :
- Résultats en temps réel
- Historique des confrontations
- Forme récente des équipes
- Statistiques détaillées (buts, possession, tirs, etc.)
- Prédictions IA avec probabilités

---

## 🎯 Exemples d'équipes populaires

### Premier League 🏴󠁧󠁢󠁥󠁮󠁧󠁿
- Manchester United
- Manchester City
- Liverpool
- Arsenal
- Chelsea
- Tottenham

### La Liga 🇪🇸
- Real Madrid
- Barcelona
- Atlético Madrid
- Sevilla

### Bundesliga 🇩🇪
- Bayern Munich
- Borussia Dortmund
- RB Leipzig
- Bayer Leverkusen

### Serie A 🇮🇹
- Juventus
- Inter Milan
- AC Milan
- Napoli
- AS Roma

### Ligue 1 🇫🇷
- Paris Saint-Germain
- Marseille
- Lyon
- Monaco

---

## 🚫 Ligues NON supportées (Tier Gratuit)

En raison des limitations du tier gratuit de Football-Data.org, les ligues suivantes ne sont **pas encore disponibles** :

### Autres Ligues Européennes
- ❌ Championship (Angleterre D2)
- ❌ Ligue 2 (France D2)
- ❌ Serie B (Italie D2)
- ❌ La Liga 2 (Espagne D2)
- ❌ 2. Bundesliga (Allemagne D2)
- ❌ Scottish Premiership (Écosse)
- ❌ Belgian Pro League (Belgique)
- ❌ Turkish Super Lig (Turquie)

### Ligues Internationales
- ❌ MLS (États-Unis)
- ❌ Liga MX (Mexique)
- ❌ Brazilian Série A
- ❌ Argentine Primera División
- ❌ Saudi Pro League
- ❌ J1 League (Japon)
- ❌ K League (Corée du Sud)
- ❌ A-League (Australie)

### Compétitions Internationales
- ❌ Conference League (UEFA)
- ❌ Copa Libertadores
- ❌ Copa Sudamericana
- ❌ CAF Champions League
- ❌ AFC Champions League

---

## 🔄 Mises à jour futures

Nous travaillons activement pour ajouter plus de ligues. Voici notre roadmap :

### Court Terme (Q1 2025)
- 🔄 Amélioration des scrapers pour plus de stabilité
- 🔄 Ajout de ligues via sources alternatives
- 🔄 Championship anglais (D2)

### Moyen Terme (Q2 2025)
- 🔄 Ligues américaines (MLS)
- 🔄 Ligues sud-américaines (Brésil, Argentine)
- 🔄 Conference League UEFA

### Long Terme (Q3-Q4 2025)
- 🔄 Ligues asiatiques
- 🔄 Ligues africaines
- 🔄 Coupes nationales
- 🔄 Matchs amicaux internationaux

---

## 💡 Comment ça marche ?

### Sources de données
```
┌─────────────────────────────────────┐
│   Architecture Hybride              │
└──────────┬──────────────────────────┘
           │
    ┌──────┴───────┬────────┬────────┐
    │              │        │        │
    ▼              ▼        ▼        ▼
Football-Data  SofaScore Odds   FBref
(Fixtures)     (Scores)  (Cotes)(Stats)
```

1. **Football-Data.org** : Calendrier des matchs (API gratuite)
2. **SofaScore** : Scores en direct (scraping)
3. **OddsChecker** : Cotes bookmakers (scraping)
4. **FBref** : Statistiques détaillées (scraping)
5. **Google Gemini AI** : Analyses prédictives

### Fréquence de mise à jour
- **Calendrier** : Mis à jour quotidiennement
- **Scores** : Temps réel (toutes les 30 secondes)
- **Classements** : Après chaque match
- **Statistiques** : Après chaque match

---

## 🔧 Support Technique

### J'ai une erreur "Ligue non disponible"
➡️ Vérifiez que la ligue fait partie des 9 compétitions supportées ci-dessus.

### Mon équipe n'apparaît pas
➡️ Certaines équipes de divisions inférieures ne sont pas accessibles avec le tier gratuit.

### Les données ne se mettent pas à jour
➡️ Le cache Redis stocke les données pendant 30 minutes. Rafraîchissez la page.

### Je veux une ligue spécifique
➡️ Contactez-nous via support@couponfoot.com avec votre demande. Si suffisamment d'utilisateurs demandent une ligue, nous l'ajouterons en priorité.

---

## 📞 Contact

**Email** : support@couponfoot.com  
**Discord** : [Rejoindre la communauté](#)  
**Twitter** : [@CouponFoot](#)

---

## 🎁 Upgrade Premium

Vous voulez **plus de ligues** et **d'analyses illimitées** ?

**Offre Pro (19.99€/mois)** :
- ✅ Toutes les ligues supportées
- ✅ Analyses illimitées
- ✅ Statistiques avancées
- ✅ Support prioritaire
- ✅ Accès anticipé aux nouvelles ligues

[**Voir les offres →**](/pricing)

---

**Dernière mise à jour** : 27/12/2024  
**Version** : 2.0 (Architecture Hybride)
