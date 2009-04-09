
/*!
 * jLayout - JavaScript Layout Algorithms v0.3
 *
 * Licensed under the new BSD License.
 * Copyright 2008, Bram Stein
 * All rights reserved.
 */
/*global jLayout */
jLayout = {
	/**
	 * Grid layout
	 */
	grid : function (spec, shared) {
		var my = shared || {},
			that = {};

		my.hgap = spec.hgap || 0;
		my.vgap = spec.vgap || 0;

		// initialize the number of columns to the number of items
		// we're laying out.
		my.items = spec.items || [];
		my.columns = spec.columns || my.items.length;
		my.rows = spec.rows || 0;

		if (my.rows > 0) {
			my.columns = Math.floor((my.items.length + my.rows - 1) / my.rows); 
		}
		else {
			my.rows = Math.floor((my.items.length + my.columns - 1) / my.columns);
		}

		that.items = function () {
			var r = [];
			Array.prototype.push.apply(r, my.items);
			return r;
		};

		that.layout = function (container) {
			var i, j,
				insets = container.insets(),
				x = insets.left,
				y = insets.top,
				width = (container.bounds().width - (insets.left + insets.right) - (my.columns - 1) * my.hgap) / my.columns,
				height = (container.bounds().height - (insets.top + insets.bottom) - (my.rows - 1) * my.vgap) / my.rows;

			for (i = 0, j = 1; i < my.items.length; i += 1, j += 1) {
				my.items[i].bounds({'x': x, 'y': y, 'width': width, 'height': height});

				if (my.columns <= my.rows) {
					if (j >= my.columns) {
						y += height + my.vgap;
						x = insets.left;
						j = 0;
					}
					else {
						x += width + my.hgap;
					}
				}
				else {
					if (j >= my.rows) {
						x += width + my.hgap;
						y = insets.top;
						j = 0;
					}
					else {
						y += height + my.vgap;
					}
				}
				my.items[i].doLayout();
			}
			return container;
		};

		function typeLayout(type) {
			return function (container) {
				var i = 0, 
					width = 0, 
					height = 0, 
					type_size,
					insets = container.insets();

				for (; i < my.items.length; i += 1) {
					type_size = my.items[i][type + 'Size']();
					width = Math.max(width, type_size.width);
					height = Math.max(height, type_size.height);
				}
				return {
					'width': insets.left + insets.right + my.columns * width + (my.columns - 1) * my.hgap, 
					'height': insets.top + insets.bottom + my.rows * height + (my.rows - 1) * my.vgap
				};
			};
		}

		// this creates the min and preferred size methods, as they
		// only differ in the function they call.
		that.preferred = typeLayout('preferred');
		that.minimum = typeLayout('minimum');
		that.maximum = typeLayout('maximum');
		return that;
	},

	/**
	 * Flex grid based on: http://www.javaworld.com/javaworld/javatips/jw-javatip121.html
	 */
	flexGrid: function (spec) {
		var my = {},
			that = this.grid(spec, my);

		function zeroArray(a, l) {
			var i = 0;
			for (; i < l; i += 1) {
				a[i] = 0;
			}
			return a;
		}

		function typeLayout(type) {
			return function (container) {
				var i = 0, r = 0, c = 0, nw = 0, nh = 0,
					w = zeroArray([], my.columns),
					h = zeroArray([], my.rows),
					type_size,
					insets = container.insets();
			
				for (i = 0; i < my.items.length; i += 1) {
					r = i / my.columns;
					c = i % my.columns;
					type_size = my.items[i][type + 'Size']();
					if (w[c] < type_size.width) {
						w[c] = type_size.width;
					}
					if (h[r] < type_size.height) {
						h[r] = type_size.height;
					}
				}
				for (i = 0; i < my.columns; i += 1) {
					nw += w[i];
				}
				for (i = 0; i < my.rows; i += 1) {
					nh += h[i];
				}
				return {
					width: insets.left + insets.right + nw + (my.columns - 1) * my.hgap,
					height: insets.top + insets.bottom + nh + (my.rows - 1) * my.vgap
				};
			};
		}

		that.preferred = typeLayout('preferred');
		that.minimum = typeLayout('minimum');
		that.maximum = typeLayout('maximum');

		that.layout = function (container) {
			var i = 0, c = 0, r = 0,
				pd = that.preferred(container),
				sw = container.bounds().width / pd.width,
				sh = container.bounds().height / pd.height,
				w = zeroArray([], my.columns),
				h = zeroArray([], my.rows),
				insets = container.insets(),
				x = insets.left,
				y = insets.top,
				d;

			for (i = 0; i < my.items.length; i += 1) {
				r = i / my.columns;
				c = i % my.columns;
				d = my.items[i].preferredSize();
				d.width = sw * d.width;
				d.height = sh * d.height;

				if (w[c] < d.width) {
					w[c] = d.width;
				}
				if (h[r] < d.height) {
					h[r] = d.height;
				}
			}

			for (c = 0; c < my.columns; c += 1) {
				for (r = 0, y = insets.top; r < my.rows; r += 1) {
					i = r * my.columns + c;
					if (i < my.items.length) {
						my.items[i].bounds({'x': x, 'y': y, 'width': w[c], 'height': h[r]});
						my.items[i].doLayout();
					}
					y += h[r] + my.vgap;
				}
				x += w[c] + my.hgap;
			}

			return container;
		};

		return that;
	},

	/**
	 * Border layout
	 */
	border : function (spec) {
		var my = {},
			that = {},
			east = spec.east,
			west = spec.west,
			north = spec.north,
			south = spec.south,
			center = spec.center;

		my.hgap = spec.hgap || 0;
		my.vgap = spec.vgap || 0;

		that.items = function () {
			var items = [];
			if (east) {
				items.push(east);
			}

			if (west) {
				items.push(west);
			}

			if (north) {
				items.push(north);
			}

			if (south) {
				items.push(south);
			}

			if (center) {
				items.push(center);
			}
			return items;
		};		

		that.layout = function (container) {
			var size = container.bounds(),
				insets = container.insets(),
				top = insets.top,
				bottom = size.height - insets.bottom,
				left = insets.left,
				right = size.width - insets.right,
				tmp;

			if (north && north.isVisible()) {
				tmp = north.preferredSize();
				north.bounds({'x': left, 'y': top, 'width': right - left, 'height': tmp.height});
				north.doLayout();

				top += tmp.height + my.vgap;
			}
			if (south && south.isVisible()) {
				tmp = south.preferredSize();
				south.bounds({'x': left, 'y': bottom - tmp.height, 'width': right - left, 'height': tmp.height});
				south.doLayout();

				bottom -= tmp.height + my.vgap;
			}
			if (east && east.isVisible()) {
				tmp = east.preferredSize();
				east.bounds({'x': right - tmp.width, 'y': top, 'width': tmp.width, 'height': bottom - top});
				east.doLayout();

				right -= tmp.width + my.hgap;
			}
			if (west && west.isVisible()) {
				tmp = west.preferredSize();
				west.bounds({'x': left, 'y': top, 'width': tmp.width, 'height': bottom - top});
				west.doLayout();

				left += tmp.width + my.hgap;
			}
			if (center && center.isVisible()) {
				center.bounds({'x': left, 'y': top, 'width': right - left, 'height': bottom - top});
				center.doLayout();
			}
			return container;
		};

		function typeLayout(type) {
			return function (container) {
				var insets = container.insets(),
					width = 0,
					height = 0,
					type_size;

				if (east && east.isVisible()) {
					type_size = east[type + 'Size']();
					width += type_size.width + my.hgap;
					height = type_size.height;
				}
				if (west && west.isVisible()) {
					type_size = west[type + 'Size']();
					width += type_size.width + my.hgap;
					height = Math.max(type_size.height, height);
				}
				if (center && center.isVisible()) {
					type_size = center[type + 'Size']();
					width += type_size.width;
					height = Math.max(type_size.height, height);
				}
				if (north && north.isVisible()) {
					type_size = north[type + 'Size']();
					width = Math.max(type_size.width, width);
					height += type_size.height + my.vgap;
				}
				if (south && south.isVisible()) {
					type_size = south[type + 'Size']();
					width = Math.max(type_size.width, width);
					height += type_size.height + my.vgap;
				}

				return {
					'width': width + insets.left + insets.right, 
					'height': height + insets.top + insets.bottom
				};
			};
		}
		that.preferred = typeLayout('preferred');
		that.minimum = typeLayout('minimum');
		that.maximum = typeLayout('maximum');
		return that;
	}
};
