FROM ubuntu:latest
COPY "401.html" "./"
COPY "index.twig" "./"
COPY "./build/pager" "./"
CMD "./pager"