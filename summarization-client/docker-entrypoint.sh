#!/bin/sh

# Copyright 2024 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

## Substitutes env variables in main.*.js bundle
sed -i 's/${APP_CONFIG}/'"${APP_CONFIG}"'/' $(ls /usr/share/nginx/html/main*.js)
## Starts the application
nginx -g 'daemon off;'