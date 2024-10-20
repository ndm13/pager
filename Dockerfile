FROM ubuntu:latest
COPY "401.html" "./"
COPY "index.twig" "./"
COPY "./build/pager" "./"
EXPOSE 8000
CMD "./pager"