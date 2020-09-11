import subprocess
from time import sleep
subprocess.call(['node', 'get.js'])

while True:
    subprocess.call(['node', 'index.js'])
    sleep(3600)
