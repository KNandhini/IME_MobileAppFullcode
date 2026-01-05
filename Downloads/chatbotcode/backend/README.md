## Running the FastAPI Server

### Prerequisites

- Make sure you have [`uv`](https://docs.astral.sh/uv/getting-started/installation/) installed on your system. If not, follow the installation guide linked above.
- Make sure you are inside `backend` directory before running any below commands.

### Steps

```bash
# create a virtual environment
uv venv

# activate the virtualenv
https://docs.astral.sh/uv/pip/environments/#using-a-virtual-environment

# install dependencies and sync them with the virtual env
uv sync
#.venv\Scripts\activate
# launch the server
fastapi run app/main.py
```
