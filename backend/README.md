# ⚡ Defizz — Backend

Backend Node.js/Express pour l'application Defizz.
Conçu pour Kubernetes : stateless, scalable, observable.

---

## 🗂️ Structure

```
defizz-backend/
├── src/
│   ├── index.js              ← Entrée : /health /whoami /crash + routes API
│   ├── logger.js             ← Logs JSON structurés → stdout/stderr
│   ├── db/
│   │   ├── index.js          ← Pool PostgreSQL (config via env vars)
│   │   ├── schema.sql        ← Schéma BDD (idempotent)
│   │   └── init.js           ← Init au démarrage
│   ├── middleware/
│   │   ├── auth.js           ← Vérification JWT (stateless)
│   │   └── requestLogger.js  ← Log HTTP en JSON
│   └── routes/
│       ├── users.js          ← Register / Login / Profil / Stats
│       ├── challenges.js     ← CRUD + Join / Complete / Commentaires
│       └── leaderboard.js    ← Classement
├── k8s/
│   ├── namespace.yaml
│   ├── ingress.yaml
│   ├── backend/
│   │   ├── deployment.yaml   ← 3 replicas, rolling update, probes
│   │   ├── configmap.yaml
│   │   └── hpa.yaml
│   └── postgres/
│       ├── statefulset.yaml
│       ├── secret.yaml
│       └── pvc.yaml          ← 5Gi persistant
├── Dockerfile
├── docker-compose.yml        ← Dev local
└── .env.example
```

---

## 🚀 Lancer en local (sans Kubernetes)

```bash
# 1. Copier la config
cp .env.example .env

# 2. Lancer PostgreSQL + backend avec Docker Compose
docker-compose up -d

# 3. Tester
curl http://localhost:4000/health
curl http://localhost:4000/whoami
```

Ou sans Docker, avec une BDD PostgreSQL locale :
```bash
npm install
# Créer la base : createdb defizz
node src/index.js
```

---

## ☸️ Déploiement Kubernetes (Kind)

```bash
# 1. Créer le cluster
kind create cluster --name defizz

# 2. Build + charger l'image
docker build -t defizz-backend:latest .
kind load docker-image defizz-backend:latest --name defizz

# 3. Installer l'Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller --timeout=90s

# 4. Déployer tout
kubectl apply -f k8s/

# 5. Vérifier
kubectl get all -n defizz

# 6. Ajouter dans /etc/hosts
echo "127.0.0.1  defizz.local" | sudo tee -a /etc/hosts
```

---

## 🧪 Démonstrations Kubernetes

### Résilience — suppression d'un Pod
```bash
# Terminal 1 : observer
kubectl get pods -n defizz -w

# Terminal 2 : supprimer un pod backend
kubectl delete pod -n defizz -l app=backend --field-selector=status.phase=Running

# → Kubernetes recrée le pod automatiquement en quelques secondes
```

### Load balancing — /whoami
```bash
# Chaque appel peut être traité par un pod différent
for i in {1..6}; do
  curl -s http://defizz.local/whoami | python3 -c "import sys,json; print(json.load(sys.stdin)['pod'])"
done
# Sortie :
# backend-7d9f8b-xk2p1
# backend-7d9f8b-mn3q7
# backend-7d9f8b-xk2p1
# backend-7d9f8b-pz9r2
# ...
```

### Auto-healing — /crash
```bash
# Terminal 1 : observer
kubectl get pods -n defizz -w

# Terminal 2 : crasher un pod
curl http://defizz.local/crash

# → Pod passe en Error, Kubernetes le redémarre immédiatement
```

### Rolling update — zéro downtime
```bash
# Simuler une mise à jour d'image
kubectl set image deployment/backend \
  backend=defizz-backend:v2 -n defizz

# Observer le déploiement progressif
kubectl rollout status deployment/backend -n defizz -w
```

### Scaling manuel
```bash
kubectl scale deployment backend --replicas=5 -n defizz
kubectl get pods -n defizz -w
```

### Logs structurés JSON
```bash
# Logs en temps réel de tous les pods backend
kubectl logs -l app=backend -n defizz --follow

# Exemple de sortie :
# {"timestamp":"2024-01-15T10:23:45.123Z","level":"info","message":"défi créé","pod":"backend-7d9f8b-xk2p1","challengeId":42,"userId":1}
```

---

## 🌐 API REST

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/health` | — | Probe Kubernetes |
| GET | `/whoami` | — | Identité du Pod |
| GET | `/crash` | — | Crash demo |
| POST | `/api/users/register` | — | Inscription |
| POST | `/api/users/login` | — | Connexion → JWT |
| GET | `/api/users/:id` | ✅ | Profil + listes défis |
| GET | `/api/users/:id/stats` | ✅ | Statistiques |
| GET | `/api/challenges` | ✅ | Liste défis publics |
| POST | `/api/challenges` | ✅ | Créer un défi |
| GET | `/api/challenges/:id` | ✅ | Détail |
| GET | `/api/challenges/:id/participants` | ✅ | Participants |
| POST | `/api/challenges/:id/join` | ✅ | Rejoindre |
| POST | `/api/challenges/:id/complete` | ✅ | Marquer relevé |
| GET | `/api/challenges/:id/comments` | ✅ | Commentaires |
| POST | `/api/challenges/:id/comments` | ✅ | Commenter |
| GET | `/api/leaderboard` | ✅ | Classement |

---

## 📋 Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `4000` | Port du serveur |
| `LOG_LEVEL` | `info` | debug/info/warn/error |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_NAME` | `defizz` | Nom de la base |
| `DB_USER` | `postgres` | Utilisateur |
| `DB_PASSWORD` | — | Mot de passe |
| `JWT_SECRET` | — | Clé JWT (Secret K8s) |
| `JWT_EXPIRES` | `7d` | Durée des tokens |

---

## ☸️ Concepts Kubernetes démontrés

| Concept | Où | Explication |
|---------|-----|-------------|
| **Stateless** | `src/` | JWT, pas de session serveur |
| **Deployment** | `k8s/backend/deployment.yaml` | 3 replicas, rolling update |
| **StatefulSet** | `k8s/postgres/statefulset.yaml` | PostgreSQL avec identité stable |
| **PVC** | `k8s/postgres/statefulset.yaml` | Stockage persistant 5Gi |
| **Service ClusterIP** | `deployment.yaml` | Load balancer interne |
| **Ingress** | `k8s/ingress.yaml` | Routeur HTTP |
| **ConfigMap** | `k8s/backend/configmap.yaml` | Config non-sensible |
| **Secret** | `k8s/backend/configmap.yaml` + postgres | Données sensibles |
| **HPA** | `k8s/ingress.yaml` | Autoscaling CPU |
| **Liveness probe** | `deployment.yaml` | Restart auto si crash |
| **Readiness probe** | `deployment.yaml` | Trafic seulement si prêt |
| **SIGTERM** | `src/index.js` | Arrêt propre |
| **Logs stdout** | `src/logger.js` | JSON → collecte K8s |
