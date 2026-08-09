# CONSIGNE COMPLÉMENTAIRE — RECENTRAGE DES RÔLES + MESSAGERIE INSTANTANÉE

Ceci vient EN PLUS de ce qui est déjà fait (palette, inscription 2 étapes, YouTube embed, fiche de suivi d'âme, binômage). Ne refais pas ce qui existe déjà — complète et corrige uniquement ce qui suit.

---

## 1. CHANGEMENT DE PÉRIMÈTRE — LE MODÉRATEUR NE GÈRE PLUS LES COURS

**Retire du modérateur** (si déjà implémenté ainsi) :
- L'upload de fichiers audio/vidéo de cours
- L'édition des métadonnées de cours (titre, description, dates)
- La correction/notation des devoirs, exercices, et notes manuscrites

**Le modérateur garde uniquement** :
- La fiche de suivi d'âme (déjà fait — assiduité, méditation, situation sociale, journal, confidentiel modérateur+admin)
- Le binômage (déjà fait)
- Passage de classe de ses étudiants
- Consultation en LECTURE SEULE de la présence/notes de ses étudiants (pour nourrir son suivi pastoral — il ne corrige rien)
- **Nouveau** : publication d'annonces/infos d'événements visibles par les étudiants de sa/ses classe(s) (texte simple, titre + contenu + date, pas de contenu pédagogique)
- **Nouveau** : accès à la messagerie instantanée (cf. section 3)

Ajuste les policies RLS en conséquence : le modérateur ne doit plus avoir de droits d'écriture sur `courses`, `assignments`, `submissions` (notation), ni sur les buckets `cours` — seulement en lecture pour ce qui concerne ses classes assignées.

---

## 2. GESTION DES COURS — TOUT PASSE À L'ADMINISTRATEUR

L'administrateur doit avoir une interface complète de gestion de cours, avec pour chaque cours :

- Champs : titre, date, objectif, classe associée
- **Vidéo — deux options possibles, au choix pour chaque cours** :
  - Coller un lien externe (YouTube) → utilise le CoursePlayer déjà en place qui détecte et embed automatiquement
  - OU importer directement un fichier vidéo → upload vers le bucket Supabase `cours`
- **Audio — mêmes deux options** :
  - Coller un lien externe OU importer un fichier audio directement vers le bucket `cours`
- **Suppression** : bouton de suppression sur chaque cours existant, avec confirmation avant suppression définitive (et suppression du fichier associé dans le bucket si c'était un import direct, pas juste un lien externe)
- **Correction des soumissions** : l'admin doit maintenant avoir accès à l'interface de correction (devoirs, exercices, notes manuscrites) — reprendre l'interface qui existait côté modérateur et la déplacer/dupliquer côté admin

Ajoute un avertissement discret dans l'interface d'upload direct (pas un blocage, juste une info) : "Les fichiers importés directement consomment le quota de bande passante Supabase à chaque écoute/visionnage. Privilégiez un lien YouTube quand c'est possible."

---

## 3. MESSAGERIE INSTANTANÉE (Supabase Realtime)

Crée une nouvelle table `messages` :
```sql
create table messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null,
  sender_id uuid not null references profiles(id),
  content text not null,
  sent_at timestamptz default now(),
  read_at timestamptz
);

create table conversations (
  id uuid primary key default uuid_generate_v4(),
  type text check (type in ('MODERATEUR_ETUDIANT', 'MODERATEUR_MODERATEUR')) not null,
  participant_1 uuid not null references profiles(id),
  participant_2 uuid not null references profiles(id),
  created_at timestamptz default now()
);
```

**Deux types de conversation** :
- **Modérateur ↔ Étudiant** : conversation privée liée au suivi pastoral, un modérateur ne peut discuter qu'avec les étudiants de sa/ses classe(s) assignée(s)
- **Modérateur ↔ Modérateur** : conversation entre modérateurs pour coordination

**Temps réel** : active Supabase Realtime sur la table `messages` (`supabase.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)`), pour que les nouveaux messages apparaissent instantanément sans rechargement de page.

**RLS** : un utilisateur ne voit que les conversations où il est `participant_1` ou `participant_2`. Un modérateur ne peut créer de conversation avec un étudiant que si cet étudiant appartient à une classe qui lui est assignée.

**Interface** : liste des conversations à gauche, fil de discussion à droite (ou en plein écran sur mobile), champ de saisie en bas, indicateur de message non lu.

---

## 4. ORDRE D'EXÉCUTION

1. Corriger les policies RLS du modérateur (retirer les droits sur cours/corrections)
2. Ajouter l'interface admin de gestion de cours (lien OU upload + suppression)
3. Déplacer l'interface de correction des soumissions vers l'admin
4. Ajouter la fonctionnalité d'annonces pour le modérateur
5. Créer les tables `conversations` et `messages` + policies RLS
6. Implémenter la messagerie instantanée avec Supabase Realtime
7. Build et test complet, rapport final point par point
