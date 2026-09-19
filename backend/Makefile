.PHONY: dev down test migrate clean

dev:
	docker compose up -d --build

down:
	docker compose down

test:
	docker compose run --rm api pytest -v

migrate:
	docker compose run --rm api alembic upgrade head

clean:
	docker compose down -v
